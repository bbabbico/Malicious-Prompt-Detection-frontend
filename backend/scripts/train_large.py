# e5-large 임베딩 + LightGBM & XGBoost 학습
import sys
import time
import pickle
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import lightgbm as lgb
import xgboost as xgb
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, classification_report, confusion_matrix

sys.stdout.reconfigure(encoding="utf-8")
warnings.filterwarnings("ignore")

# ── 경로 & 설정 ────────────────────────────────────────────
ARTIFACTS_DIR  = Path(__file__).parent.parent / "artifacts"
DATA_PATH      = ARTIFACTS_DIR / "integrated_data.csv"

B_MODEL_NAME   = "intfloat/multilingual-e5-large"
B_BATCH_SIZE   = 64
B_EMBED_PATH   = ARTIFACTS_DIR / "large" / "embeddings_large.npy"
B_LABEL_PATH   = ARTIFACTS_DIR / "large" / "labels_large.npy"
LGB_MODEL_PATH = ARTIFACTS_DIR / "large" / "detector_model_large.pkl"
XGB_MODEL_PATH = ARTIFACTS_DIR / "large" / "detector_model_xgb_large.json"

SAMPLE_SIZE  = 2000   # 메모리/연산 제약으로 전체 대신 계층 표본 사용
TEST_SIZE    = 0.2
RANDOM_STATE = 42

ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
(ARTIFACTS_DIR / "large").mkdir(parents=True, exist_ok=True)


# ══════════════════════════════════════════════════════════
# STEP 1 | 데이터 로드 및 샘플링
# ══════════════════════════════════════════════════════════
print("=" * 65)
print("STEP 1 | 데이터 로드 및 샘플링")
print("=" * 65)

df_full = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
print(f"전체 데이터: {len(df_full):,}행  "
      f"(정상={df_full['label'].eq(0).sum():,}, 악성={df_full['label'].eq(1).sum():,})")

df_sample, _ = train_test_split(
    df_full, train_size=SAMPLE_SIZE,
    stratify=df_full["label"], random_state=RANDOM_STATE,
)
df_sample = df_sample.reset_index(drop=True)
labels    = df_sample["label"].values
texts     = ["query: " + t for t in df_sample["text"].astype(str).tolist()]

print(f"표본 추출: {len(df_sample):,}행  "
      f"(정상={(labels==0).sum()}, 악성={(labels==1).sum()})")


# ══════════════════════════════════════════════════════════
# STEP 2 | 텍스트 임베딩
# ══════════════════════════════════════════════════════════
print("\n" + "=" * 65)
print(f"STEP 2 | 텍스트 임베딩  ({B_MODEL_NAME})")
print("=" * 65)

embedder_b = SentenceTransformer(B_MODEL_NAME)
n_batches  = (len(texts) + B_BATCH_SIZE - 1) // B_BATCH_SIZE
print(f"임베딩 시작: {len(texts)}개 / {n_batches}배치\n")

t0 = time.time()
batches    = [texts[i:i + B_BATCH_SIZE] for i in range(0, len(texts), B_BATCH_SIZE)]
embed_list = []
for batch in tqdm(batches, desc="임베딩", unit="batch", ncols=80):
    embed_list.append(embedder_b.encode(batch, show_progress_bar=False))
embeddings = np.vstack(embed_list)
elapsed    = time.time() - t0
print(f"\n임베딩 완료  shape={embeddings.shape}  소요={elapsed:.1f}초")


# ══════════════════════════════════════════════════════════
# STEP 3 | 임베딩 저장
# ══════════════════════════════════════════════════════════
print("\n" + "=" * 65)
print("STEP 3 | 임베딩 저장")
print("=" * 65)

np.save(B_EMBED_PATH, embeddings)
np.save(B_LABEL_PATH, labels)
print(f"저장 → {B_EMBED_PATH.name}, {B_LABEL_PATH.name}")


# ══════════════════════════════════════════════════════════
# STEP 4 | Train / Test 분리 (80/20, stratified)
# ══════════════════════════════════════════════════════════
print("\n" + "=" * 65)
print("STEP 4 | Train / Test 분리 (80 / 20)")
print("=" * 65)

X_train, X_test, y_train, y_test = train_test_split(
    embeddings, labels,
    test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=labels,
)
print(f"Train: {len(X_train):,}개  (악성={y_train.sum():,}  정상={(y_train==0).sum():,})")
print(f"Test : {len(X_test):,}개   (악성={y_test.sum():,}  정상={(y_test==0).sum():,})")


# ══════════════════════════════════════════════════════════
# STEP 5 | LightGBM 학습  ([2] e5-large + LightGBM)
# ══════════════════════════════════════════════════════════
print("\n" + "=" * 65)
print("STEP 5 | LightGBM 학습  [2] e5-large + LightGBM")
print("=" * 65)

params_lgb = {
    "objective":         "binary",
    "metric":            "binary_logloss",
    "boosting_type":     "gbdt",
    "learning_rate":     0.03,
    "num_leaves":        127,
    "max_depth":         8,
    "min_child_samples": 20,
    "feature_fraction":  0.4,
    "bagging_fraction":  0.8,
    "bagging_freq":      5,
    "reg_alpha":         0.1,
    "reg_lambda":        0.1,
    "is_unbalance":      True,
    "verbose":           -1,
}

print("학습 시작 (early stopping: 50 rounds, max: 1500)...\n")
t1 = time.time()
model_lgb = lgb.train(
    params_lgb,
    lgb.Dataset(X_train, label=y_train),
    num_boost_round=1500,
    valid_sets=[
        lgb.Dataset(X_train, label=y_train),
        lgb.Dataset(X_test,  label=y_test),
    ],
    valid_names=["train", "valid"],
    callbacks=[
        lgb.early_stopping(stopping_rounds=50, verbose=True),
        lgb.log_evaluation(period=100),
    ],
)
print(f"\n학습 완료  최적 반복: {model_lgb.best_iteration}  소요: {time.time()-t1:.1f}초")
with open(LGB_MODEL_PATH, "wb") as f:
    pickle.dump(model_lgb, f)
print(f"모델 저장 → {LGB_MODEL_PATH.name}")


# ══════════════════════════════════════════════════════════
# STEP 6 | XGBoost 학습  ([4] e5-large + XGBoost)
# ══════════════════════════════════════════════════════════
print("\n" + "=" * 65)
print("STEP 6 | XGBoost 학습  [4] e5-large + XGBoost")
print("=" * 65)

scale_pos = float((y_train == 0).sum()) / float((y_train == 1).sum())
params_xgb = {
    "objective":        "binary:logistic",
    "eval_metric":      "logloss",
    "tree_method":      "hist",
    "scale_pos_weight": scale_pos,
    "max_depth":        8,
    "learning_rate":    0.03,
    "subsample":        0.8,
    "colsample_bytree": 0.4,
    "min_child_weight": 20,
    "reg_alpha":        0.1,
    "reg_lambda":       1.1,
    "seed":             RANDOM_STATE,
    "verbosity":        0,
}

dm_train = xgb.DMatrix(X_train, label=y_train)
dm_test  = xgb.DMatrix(X_test,  label=y_test)

print("학습 시작 (early stopping: 50 rounds, max: 1500)...\n")
t2 = time.time()
model_xgb = xgb.train(
    params_xgb, dm_train,
    num_boost_round=1500,
    evals=[(dm_train, "train"), (dm_test, "valid")],
    early_stopping_rounds=50,
    verbose_eval=100,
)
print(f"\n학습 완료  최적 반복: {model_xgb.best_iteration}  소요: {time.time()-t2:.1f}초")
model_xgb.save_model(str(XGB_MODEL_PATH))
print(f"모델 저장 → {XGB_MODEL_PATH.name}")


# ══════════════════════════════════════════════════════════
# STEP 7 | HF test split 교차 평가
# ══════════════════════════════════════════════════════════
print("\n" + "=" * 65)
print("STEP 7 | HF test split 교차 평가  (deepset/prompt-injections)")
print("=" * 65)

try:
    from datasets import load_dataset
    hf_test    = load_dataset("deepset/prompt-injections", split="test")
    hf_test_df = pd.DataFrame(hf_test)[["text", "label"]]
    hf_test_df["label"] = pd.to_numeric(hf_test_df["label"], errors="coerce")
    hf_test_df = hf_test_df.dropna(subset=["label"])
    hf_test_df["label"] = hf_test_df["label"].astype(int)
    hf_test_df = hf_test_df[hf_test_df["label"].isin([0, 1])].reset_index(drop=True)
    hf_true    = hf_test_df["label"].values

    hf_texts_test = ["query: " + t for t in hf_test_df["text"].tolist()]
    hf_embs_test  = embedder_b.encode(hf_texts_test, show_progress_bar=False, batch_size=32)

    for tag, prob in [
        ("[2] e5-large + LightGBM",
         model_lgb.predict(hf_embs_test, num_iteration=model_lgb.best_iteration)),
        ("[4] e5-large + XGBoost",
         model_xgb.predict(xgb.DMatrix(hf_embs_test))),
    ]:
        pred = (prob >= 0.5).astype(int)
        tn, fp, fn, tp = confusion_matrix(hf_true, pred).ravel()
        f1  = f1_score(hf_true, pred, zero_division=0)
        fpr = fp / (tn + fp) if (tn + fp) > 0 else 0.0
        print(f"\n  {tag}")
        print(f"  F1={f1:.4f}  FPR={fpr*100:.2f}%  TN={tn} FP={fp} FN={fn} TP={tp}")
        print(classification_report(hf_true, pred,
                                    target_names=["정상(0)", "악성(1)"], digits=4))
except Exception as e:
    print(f"HF 교차 평가 실패: {e}")

print("=" * 65)
print("파이프라인 완료  →  evaluate.py 로 전체 벤치마크 가능")
print("=" * 65)
