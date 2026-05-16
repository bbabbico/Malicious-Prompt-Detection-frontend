#  모델이 놓친 FN(미탐) 샘플 패턴 분석용 디버깅 도구  
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"

embeddings = np.load(ARTIFACTS_DIR / "small" / "embeddings.npy")
labels     = np.load(ARTIFACTS_DIR / "small" / "labels.npy")
df         = pd.read_csv(ARTIFACTS_DIR / "integrated_data.csv", encoding="utf-8-sig")

_, X_test, _, y_test, _, idx_test = train_test_split(
    embeddings, labels, df.index.values,
    test_size=0.2, random_state=42, stratify=labels
)

model  = pickle.load(open(ARTIFACTS_DIR / "small" / "detector_model.pkl", "rb"))
y_prob = model.predict(X_test, num_iteration=model.best_iteration)
y_pred = (y_prob >= 0.5).astype(int)

fn_mask    = (y_test == 1) & (y_pred == 0)
fn_indices = idx_test[fn_mask]
fn_probs   = y_prob[fn_mask]

fn_df = df.loc[fn_indices, ["text", "source"]].copy()
fn_df["mal_prob"] = fn_probs
fn_df = fn_df.sort_values("mal_prob").reset_index(drop=True)

pd.set_option("display.max_colwidth", 400)
print(f"FN total: {len(fn_df)}\n")
for i, row in fn_df.iterrows():
    print(f"--- FN #{i+1}  prob={row['mal_prob']:.6f}  source={row['source']} ---")
    print(row["text"])
    print()
