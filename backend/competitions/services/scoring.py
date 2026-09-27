def compute_points(correct: bool, response_time_seconds: float, time_limit_seconds: int, difficulty: int = 2, base_points: int = 100, max_speed_bonus: int = 50):
    if not correct:
        return 0
    diff_map = {1: 0.8, 2: 1.0, 3: 1.3}
    multiplier = diff_map.get(difficulty, 1.0)
    base = int(base_points * multiplier)
    if time_limit_seconds <= 0:
        return base
    response_ratio = min(max(response_time_seconds / float(time_limit_seconds), 0.0), 1.0)
    bonus = int(max_speed_bonus * (1.0 - response_ratio))
    return base + bonus
