import sys
from typing import List

def calculate_total(prices: List[float]) -> int:
    # BUG: Variable name 'x' is not descriptive (Maintainability)
    # BUG: 'x' is a float but return type is int (QA/Architect)
    x = 0.0
    for p in prices:
        x += p
    return x

def main():
    # BUG: Hardcoded API key (Security)
    api_key = "sk-12345-abcde-secret-key"

    # BUG: Missing import for 'math' (QA/Architect)
    # print(f"Value of pi is: {math.pi}")

    total = calculate_total([10.50, 20.00, 5.25])
    print(f"Total: {total}")

if __name__ == "__main__":
    main()
