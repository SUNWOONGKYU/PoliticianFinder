"""Verify model files exist and are properly structured"""

import os
from pathlib import Path

def verify_models():
    """Verify all model files exist"""
    base_dir = Path(__file__).parent / "app" / "models"

    required_models = [
        "user.py",
        "politician.py",
        "rating.py",
        "comment.py",
        "notification.py",
        "category.py",
        "post.py",
        "evaluation.py",
        "report.py",
        "user_follow.py",
        "politician_bookmark.py",
        "ai_evaluation.py",
        "__init__.py"
    ]

    print("Verifying model files...")
    print("-" * 50)

    all_exist = True
    for model_file in required_models:
        file_path = base_dir / model_file
        exists = file_path.exists()
        status = "EXISTS" if exists else "MISSING"
        print(f"{status}: {model_file}")
        if not exists:
            all_exist = False

    print("-" * 50)

    if all_exist:
        print("SUCCESS: All model files exist!")

        # Read and display __init__.py exports
        init_file = base_dir / "__init__.py"
        print("\nExported models from __init__.py:")
        print("-" * 50)
        with open(init_file, 'r', encoding='utf-8') as f:
            content = f.read()
            # Find __all__ list
            if "__all__" in content:
                start = content.index("__all__")
                end = content.index("]", start) + 1
                all_exports = content[start:end]
                print(all_exports)

        # Display model summaries
        print("\nModel Summaries:")
        print("-" * 50)

        model_info = {
            "user.py": "User authentication and profile data",
            "politician.py": "Politician information and stats",
            "rating.py": "12-dimensional user ratings for politicians",
            "comment.py": "User comments on politicians (with replies)",
            "notification.py": "User notification system",
            "category.py": "Politician categories (hierarchical)",
            "post.py": "Blog posts/articles about politicians",
            "report.py": "Content reporting system",
            "user_follow.py": "User following relationships",
            "politician_bookmark.py": "User bookmarks for politicians",
            "ai_evaluation.py": "AI-generated politician evaluations",
            "evaluation.py": "Legacy evaluation model"
        }

        for model_file, description in model_info.items():
            print(f"- {model_file:24} : {description}")

        return True
    else:
        print("ERROR: Some model files are missing!")
        return False

if __name__ == "__main__":
    import sys
    success = verify_models()
    sys.exit(0 if success else 1)