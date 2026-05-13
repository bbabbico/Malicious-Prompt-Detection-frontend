from typing import Tuple

def analyze_prompt_threat(prompt: str) -> Tuple[bool, int]:
    """
    AI 개발자가 구현할 핵심 분석 함수입니다.
    
    Args:
        prompt (str): 사용자의 입력 프롬프트
        
    Returns:
        Tuple[bool, int]: (악성 여부 True/False, 위험도 점수 0 ~ 100)
    """
    # TODO: AI 개발자가 이 부분을 실제 모델 추론 로직으로 교체할 예정입니다.
    import random
    
    # 임시 로직: 랜덤하게 결과 반환
    is_malicious = random.choice([True, False])
    risk_score = random.randint(0, 100)
    
    return is_malicious, risk_score
