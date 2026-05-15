"""
Comprehensive curriculum seeding for all supported languages.

Creates 13 quests per language (4 basic + 5 intermediate + 4 advanced)
+ 2 checkpoint quests per language (for L2 and L3 unlocks).

Supports: Python, Java, C++, JavaScript, TypeScript, C

Run standalone: python -m scripts.seed_curriculum
Or imported and called from seed.py after user creation.
"""
import uuid
from sqlalchemy.orm import Session
from app.models.quest import Quest
from app.models.test_case import TestCase
from app.models.learning_path import LearningPath, LearningPathQuest


class CurriculumGenerator:
    """Generates quests and learning paths for a single language."""

    def __init__(self, session: Session, language: str, base_order_rank: int = 1):
        """
        Args:
            session: SQLAlchemy session
            language: Language code (e.g., 'python', 'java')
            base_order_rank: Starting order rank for this language's quests
        """
        self.session = session
        self.language = language
        self.base_order_rank = base_order_rank
        self.current_rank = base_order_rank
        self._used_order_ranks = {
            rank for (rank,) in self.session.query(Quest.order_rank).all()
        }
        self.quests = {}  # Track quests by level for learning path assignment

    def _next_order_rank(self) -> int:
        """Get next order rank and increment counter."""
        rank = self.current_rank
        while rank in self._used_order_ranks:
            rank += 1
        self._used_order_ranks.add(rank)
        self.current_rank = rank + 1
        return rank

    def _ensure_test_cases(self, quest: Quest, test_cases: list[dict]) -> None:
        """Create only missing test cases for a quest."""
        existing = self.session.query(TestCase).filter(TestCase.quest_id == quest.id).all()

        def _key(tc_input, tc_output, tc_hidden):
            return (
                tc_input,
                tc_output,
                bool(tc_hidden),
            )

        existing_keys = {
            _key(tc.input_data, tc.expected_output, tc.is_hidden)
            for tc in existing
        }

        for tc in test_cases:
            candidate = _key(
                tc.get("input_data"),
                tc.get("expected_output", "OK\n"),
                tc.get("is_hidden", False),
            )
            if candidate in existing_keys:
                continue

            self.session.add(TestCase(
                id=uuid.uuid4(),
                quest_id=quest.id,
                input_data=tc.get("input_data"),
                expected_output=tc.get("expected_output", "OK\n"),
                is_hidden=tc.get("is_hidden", False),
            ))
            existing_keys.add(candidate)

    def _create_quest(
        self,
        title: str,
        description: str,
        level: int,
        initial_code: str,
        solution_code: str,
        explanation: str,
        tags: list[str] | None = None,
        xp_reward: int | None = None,
        test_cases: list[dict] | None = None,
    ) -> Quest:
        """Create a quest if missing and ensure required test cases exist."""
        if tags is None:
            tags = []
        if xp_reward is None:
            xp_reward = 10 if level == 1 else (15 if level == 2 else 20)
        if test_cases is None:
            test_cases = [{"expected_output": "OK\n", "is_hidden": False}]

        existing_quest = (
            self.session.query(Quest)
            .filter(
                Quest.language == self.language,
                Quest.title == title,
                Quest.is_deleted.is_(False),
            )
            .first()
        )

        if existing_quest is not None:
            self._used_order_ranks.add(existing_quest.order_rank)
            self._ensure_test_cases(existing_quest, test_cases)
            return existing_quest

        quest = Quest(
            id=uuid.uuid4(),
            title=title,
            description=description,
            level=level,
            language=self.language,
            order_rank=self._next_order_rank(),
            initial_code=initial_code,
            solution_code=solution_code,
            explanation=explanation,
            tags=tags,
            xp_reward=xp_reward,
        )
        self.session.add(quest)
        self.session.flush()
        self._used_order_ranks.add(quest.order_rank)

        self._ensure_test_cases(quest, test_cases)

        return quest

    def seed_curriculum(self) -> dict:
        """
        Seed all quests and learning paths for this language.
        Returns dict with path info for integration.
        """
        method_name = f"_seed_{self.language}"
        if not hasattr(self, method_name):
            raise ValueError(f"No curriculum defined for language: {self.language}")

        getattr(self, method_name)()
        return self._create_learning_paths()

    def _create_learning_paths(self) -> dict:
        """Create learning paths and membership links only if missing."""
        paths = {}
        for level in [1, 2, 3]:
            path = (
                self.session.query(LearningPath)
                .filter(
                    LearningPath.language == self.language,
                    LearningPath.level == level,
                )
                .first()
            )

            if path is None:
                path = LearningPath(
                    id=uuid.uuid4(),
                    title=f"{self.language.capitalize()} Level {level}",
                    description=self._get_level_description(level),
                    level=level,
                    language=self.language,
                    order_rank=self.base_order_rank + level,
                )
                self.session.add(path)
                self.session.flush()

            # Attach quests for this level
            level_quests = self.quests.get(level, [])
            for rank, quest in enumerate(level_quests, start=1):
                existing_link = (
                    self.session.query(LearningPathQuest)
                    .filter(
                        LearningPathQuest.path_id == path.id,
                        LearningPathQuest.quest_id == quest.id,
                    )
                    .first()
                )
                if existing_link is None:
                    self.session.add(LearningPathQuest(
                        id=uuid.uuid4(),
                        path_id=path.id,
                        quest_id=quest.id,
                        order_rank=rank,
                    ))
                else:
                    existing_link.order_rank = rank

            paths[level] = path

        # Add checkpoint quests to unlock intermediate and advanced
        if 2 in self.quests and len(self.quests[2]) > 0:
            checkpoint_l2 = self.quests[2][0]  # Use first intermediate quest as checkpoint
            paths[2].checkpoint_quest_id = checkpoint_l2.id

        if 3 in self.quests and len(self.quests[3]) > 0:
            checkpoint_l3 = self.quests[3][0]  # Use first advanced quest as checkpoint
            paths[3].checkpoint_quest_id = checkpoint_l3.id

        self.session.flush()
        return paths

    def _get_level_description(self, level: int) -> str:
        """Get description for learning path level."""
        lang = self.language.capitalize()
        if level == 1:
            return f"Master {lang} basics: variables, operators, and control flow."
        elif level == 2:
            return f"Build {lang} skills: functions, data structures, and error handling."
        else:
            return f"Advanced {lang}: language-specific features and patterns."

    def _add_quests_by_level(self, quests: dict[int, list[Quest]]) -> None:
        """Organize quests by level."""
        for level, quest_list in quests.items():
            self.quests[level] = quest_list

    # =========================================================================
    # Python Curriculum
    # =========================================================================
    def _seed_python(self) -> None:
        """Python curriculum: 4 basic + 5 intermediate + 4 advanced quests."""

        # LEVEL 1: BASICS (4 quests)
        basic = []

        # Q1: Variables and arithmetic
        basic.append(self._create_quest(
            title="Fix the variable",
            description="The code should print 10. Fix the bug in the variable assignment.",
            level=1,
            initial_code='x = 5\nprint(x + 3)  # should print 10',
            solution_code='x = 7\nprint(x + 3)  # prints 10',
            explanation="You needed to set x = 7 so that x + 3 equals 10. Variables store values that can be used in calculations.",
            tags=["variables", "arithmetic"],
            test_cases=[{"expected_output": "10\n", "is_hidden": False}],
        ))

        # Q2: Loops
        basic.append(self._create_quest(
            title="Fix the loop range",
            description="The code should print numbers 1 to 3, one per line.",
            level=1,
            initial_code='for i in range(3):\n    print(i)',
            solution_code='for i in range(1, 4):\n    print(i)',
            explanation="range(1, 4) produces 1, 2, 3. range(3) produces 0, 1, 2. The start and stop parameters control what numbers are generated.",
            tags=["loops", "range"],
            test_cases=[{"expected_output": "1\n2\n3\n", "is_hidden": False}],
        ))

        # Q3: Conditionals
        basic.append(self._create_quest(
            title="Fix the even check",
            description="Determine if 4 is even. Fix the condition.",
            level=1,
            initial_code='n = 4\nif n % 2 == 1:\n    print("even")\nelse:\n    print("odd")',
            solution_code='n = 4\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
            explanation="n % 2 == 0 is True for even numbers. The modulo operator % gives the remainder.",
            tags=["conditions", "modulo"],
            test_cases=[{"expected_output": "even\n", "is_hidden": False}],
        ))

        # Q4: String operations
        basic.append(self._create_quest(
            title="Fix string output",
            description="Print 'hello world'. Fix the string.",
            level=1,
            initial_code='a = "hello"\nb = "world"\nprint(a + b)',
            solution_code='a = "hello "\nb = "world"\nprint(a + b)',
            explanation="You need a space between the words. Add it to the first string before concatenation.",
            tags=["strings", "concatenation"],
            test_cases=[{"expected_output": "hello world\n", "is_hidden": False}],
        ))

        # LEVEL 2: INTERMEDIATE (5 quests)
        intermediate = []

        # Q5: Functions
        intermediate.append(self._create_quest(
            title="Fix the add function",
            description="Return the sum of a and b. Fix the operator.",
            level=2,
            initial_code='def add(a, b):\n    return a - b  # wrong operator\n\nprint(add(2, 3))',
            solution_code='def add(a, b):\n    return a + b\n\nprint(add(2, 3))',
            explanation="Functions encapsulate logic. The + operator adds, while - subtracts. Use the correct operator.",
            tags=["functions", "operators"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q6: Lists
        intermediate.append(self._create_quest(
            title="Fix the list append",
            description="Append the correct number to get [1, 2, 3].",
            level=2,
            initial_code='nums = [1, 2]\nnums.append(4)  # wrong value\nprint(nums)',
            solution_code='nums = [1, 2]\nnums.append(3)\nprint(nums)',
            explanation="Lists are ordered collections. The append method adds items. You appended 4 instead of 3.",
            tags=["lists", "append"],
            test_cases=[{"expected_output": "[1, 2, 3]\n", "is_hidden": False}],
        ))

        # Q7: Dictionaries
        intermediate.append(self._create_quest(
            title="Fix dictionary lookup",
            description="Look up the value for key 'x'. Fix the key name.",
            level=2,
            initial_code='d = {"x": 42, "y": 10}\nprint(d["z"])  # wrong key',
            solution_code='d = {"x": 42, "y": 10}\nprint(d["x"])',
            explanation="Dictionaries store key-value pairs. Use the correct key 'x' to get 42, not 'z' which doesn't exist.",
            tags=["dict", "lookup"],
            test_cases=[{"expected_output": "42\n", "is_hidden": False}],
        ))

        # Q8: Input handling
        intermediate.append(self._create_quest(
            title="Fix type conversion",
            description="Convert '100' to integer and print it. Fix the conversion.",
            level=2,
            initial_code='s = "100"\nprint(int(s) + 1)  # should print 100',
            solution_code='s = "100"\nprint(int(s))',
            explanation="int() converts strings to integers. You added 1, making it 101. Remove the +1.",
            tags=["type conversion", "int"],
            test_cases=[{"expected_output": "100\n", "is_hidden": False}],
        ))

        # Q9: Nested loops
        intermediate.append(self._create_quest(
            title="Fix multiplication table",
            description="Print a simple multiplication table (2x3=6). Fix the loop.",
            level=2,
            initial_code='for i in range(1, 3):\n    for j in range(1, 4):\n        print(i * (j + 1))',
            solution_code='for i in range(1, 3):\n    for j in range(1, 4):\n        print(i * j)',
            explanation="Nested loops iterate multiple times. You multiplied by (j+1) instead of j. Fix the arithmetic.",
            tags=["loops", "nested"],
            test_cases=[{"expected_output": "1\n2\n3\n2\n4\n6\n", "is_hidden": False}],
        ))

        # LEVEL 3: ADVANCED (4 quests)
        advanced = []

        # Q10: Exception handling
        advanced.append(self._create_quest(
            title="Fix division handling",
            description="Execute division safely. Fix the zero division.",
            level=3,
            initial_code='try:\n    x = 10 / 0  # error!\n    print("OK")\nexcept:\n    print("Error")',
            solution_code='try:\n    x = 10 / 2\n    print("OK")\nexcept:\n    print("Error")',
            explanation="Try-except blocks handle errors. Division by zero raises an exception. Use 10 / 2 instead.",
            tags=["exceptions", "division"],
            test_cases=[{"expected_output": "OK\n", "is_hidden": False}],
        ))

        # Q11: List comprehensions
        advanced.append(self._create_quest(
            title="Fix list comprehension",
            description="Create [1, 4, 9] using comprehension. Fix the expression.",
            level=3,
            initial_code='nums = [x * x + 1 for x in range(1, 4)]  # wrong\nprint(nums)',
            solution_code='nums = [x * x for x in range(1, 4)]\nprint(nums)',
            explanation="List comprehensions create lists concisely. You added +1 to each value. Remove it to get [1, 4, 9].",
            tags=["comprehensions", "expressions"],
            test_cases=[{"expected_output": "[1, 4, 9]\n", "is_hidden": False}],
        ))

        # Q12: Classes basics
        advanced.append(self._create_quest(
            title="Fix class definition",
            description="Create a simple class that stores a value. Fix the initialization.",
            level=3,
            initial_code='class Box:\n    def __init__(self, x):\n        self.x = x + 1  # wrong\n\nb = Box(5)\nprint(b.x)',
            solution_code='class Box:\n    def __init__(self, x):\n        self.x = x\n\nb = Box(5)\nprint(b.x)',
            explanation="Classes store data in attributes. __init__ initializes them. You added 1 to the value.",
            tags=["classes", "init"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q13: Decorators concept
        advanced.append(self._create_quest(
            title="Fix decorator usage",
            description="Apply a simple decorator to print a message. Fix the application.",
            level=3,
            initial_code='def shout(func):\n    def wrapper():\n        print("loud:")\n        return func()\n    return wrapper\n\n@shout\ndef speak():\n    print("hello")\n\nspeak()',
            solution_code='def shout(func):\n    def wrapper():\n        print("loud:")\n        func()\n    return wrapper\n\n@shout\ndef speak():\n    print("hello")\n\nspeak()',
            explanation="Decorators wrap functions. You returned from the wrapper, preventing the inner function from running. Remove the return.",
            tags=["decorators", "functions"],
            test_cases=[{"expected_output": "loud:\nhello\n", "is_hidden": False}],
        ))

        self._add_quests_by_level({1: basic, 2: intermediate, 3: advanced})

    # =========================================================================
    # Java Curriculum
    # =========================================================================
    def _seed_java(self) -> None:
        """Java curriculum: 4 basic + 5 intermediate + 4 advanced quests."""

        basic = []

        # Q1: Syntax - print
        basic.append(self._create_quest(
            title="Fix Java print",
            description="Print 'hello'. Fix the syntax.",
            level=1,
            initial_code='public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"hello\")  // missing semicolon\n    }\n}',
            solution_code='public class Main {\n    public static void main(String[] args) {\n        System.out.println("hello");\n    }\n}',
            explanation="Java requires semicolons at the end of statements. Add it after println().",
            tags=["syntax", "println"],
            test_cases=[{"expected_output": "hello\n", "is_hidden": False}],
        ))

        # Q2: Variables and operators
        basic.append(self._create_quest(
            title="Fix integer addition",
            description="Print 5 (2+3). Fix the calculation.",
            level=1,
            initial_code='public class Main {\n    public static void main(String[] args) {\n        int a = 2;\n        int b = 3;\n        System.out.println(a + b + 1);\n    }\n}',
            solution_code='public class Main {\n    public static void main(String[] args) {\n        int a = 2;\n        int b = 3;\n        System.out.println(a + b);\n    }\n}',
            explanation="Variables store integers. You added 1 extra. Remove it to get 5.",
            tags=["variables", "operators"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q3: Conditions
        basic.append(self._create_quest(
            title="Fix even number check",
            description="Check if 4 is even. Fix the condition.",
            level=1,
            initial_code='public class Main {\n    public static void main(String[] args) {\n        int n = 4;\n        if (n % 2 == 1) {\n            System.out.println("even");\n        } else {\n            System.out.println("odd");\n        }\n    }\n}',
            solution_code='public class Main {\n    public static void main(String[] args) {\n        int n = 4;\n        if (n % 2 == 0) {\n            System.out.println("even");\n        } else {\n            System.out.println("odd");\n        }\n    }\n}',
            explanation="n % 2 == 0 checks for even numbers. You used == 1 which is for odd.",
            tags=["conditions", "modulo"],
            test_cases=[{"expected_output": "even\n", "is_hidden": False}],
        ))

        # Q4: Arrays
        basic.append(self._create_quest(
            title="Fix array access",
            description="Access the first element. Fix the index.",
            level=1,
            initial_code='public class Main {\n    public static void main(String[] args) {\n        int[] arr = {10, 20, 30};\n        System.out.println(arr[1]);\n    }\n}',
            solution_code='public class Main {\n    public static void main(String[] args) {\n        int[] arr = {10, 20, 30};\n        System.out.println(arr[0]);\n    }\n}',
            explanation="Arrays are zero-indexed. Index 0 is the first element, not 1.",
            tags=["arrays", "indexing"],
            test_cases=[{"expected_output": "10\n", "is_hidden": False}],
        ))

        intermediate = []

        # Q5: Methods
        intermediate.append(self._create_quest(
            title="Fix method return",
            description="Return sum of two numbers. Fix the operator.",
            level=2,
            initial_code='public class Main {\n    static int add(int a, int b) {\n        return a - b;\n    }\n    public static void main(String[] args) {\n        System.out.println(add(3, 2));\n    }\n}',
            solution_code='public class Main {\n    static int add(int a, int b) {\n        return a + b;\n    }\n    public static void main(String[] args) {\n        System.out.println(add(3, 2));\n    }\n}',
            explanation="Methods encapsulate logic. Use + for addition, not -.",
            tags=["methods", "operators"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q6: Classes and constructors
        intermediate.append(self._create_quest(
            title="Fix class constructor",
            description="Initialize a value. Fix the constructor.",
            level=2,
            initial_code='public class Box {\n    int x;\n    Box(int val) {\n        x = val + 1;  // wrong\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Box b = new Box(5);\n        System.out.println(b.x);\n    }\n}',
            solution_code='public class Box {\n    int x;\n    Box(int val) {\n        x = val;\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Box b = new Box(5);\n        System.out.println(b.x);\n    }\n}',
            explanation="Constructors initialize objects. You added 1 to the value.",
            tags=["classes", "constructors"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q7: Loops
        intermediate.append(self._create_quest(
            title="Fix for loop",
            description="Print 1, 2, 3. Fix the range.",
            level=2,
            initial_code='public class Main {\n    public static void main(String[] args) {\n        for (int i = 0; i < 3; i++) {\n            System.out.println(i);\n        }\n    }\n}',
            solution_code='public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 3; i++) {\n            System.out.println(i);\n        }\n    }\n}',
            explanation="Loop from 1 to 3. Start at 1 and use <= instead of <.",
            tags=["loops", "for"],
            test_cases=[{"expected_output": "1\n2\n3\n", "is_hidden": False}],
        ))

        # Q8: Try-catch
        intermediate.append(self._create_quest(
            title="Fix exception handling",
            description="Handle a potential exception. Fix the division.",
            level=2,
            initial_code='public class Main {\n    public static void main(String[] args) {\n        try {\n            int x = 10 / 0;\n            System.out.println("OK");\n        } catch (Exception e) {\n            System.out.println("Error");\n        }\n    }\n}',
            solution_code='public class Main {\n    public static void main(String[] args) {\n        try {\n            int x = 10 / 2;\n            System.out.println("OK");\n        } catch (Exception e) {\n            System.out.println("Error");\n        }\n    }\n}',
            explanation="Avoid division by zero. Use 10 / 2 instead.",
            tags=["exceptions", "try-catch"],
            test_cases=[{"expected_output": "OK\n", "is_hidden": False}],
        ))

        # Q9: ArrayList
        intermediate.append(self._create_quest(
            title="Fix ArrayList usage",
            description="Add elements to list. Fix the value.",
            level=2,
            initial_code='import java.util.ArrayList;\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<Integer> nums = new ArrayList<>();\n        nums.add(1);\n        nums.add(2);\n        nums.add(4);  // wrong\n        System.out.println(nums);\n    }\n}',
            solution_code='import java.util.ArrayList;\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<Integer> nums = new ArrayList<>();\n        nums.add(1);\n        nums.add(2);\n        nums.add(3);\n        System.out.println(nums);\n    }\n}',
            explanation="ArrayList stores dynamic lists. Add 3 instead of 4.",
            tags=["ArrayList", "collections"],
            test_cases=[{"expected_output": "[1, 2, 3]\n", "is_hidden": False}],
        ))

        advanced = []

        # Q10: Inheritance
        advanced.append(self._create_quest(
            title="Fix inheritance",
            description="Call superclass method. Fix the super call.",
            level=3,
            initial_code='public class Animal {\n    void speak() {\n        System.out.println("sound");\n    }\n}\npublic class Dog extends Animal {\n    void speak() {\n        System.out.println("woof");\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Dog d = new Dog();\n        d.speak();\n    }\n}',
            solution_code='public class Animal {\n    void speak() {\n        System.out.println("sound");\n    }\n}\npublic class Dog extends Animal {\n    void speak() {\n        super.speak();\n        System.out.println("woof");\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Dog d = new Dog();\n        d.speak();\n    }\n}',
            explanation="super.speak() calls the parent method. You missed it.",
            tags=["inheritance", "super"],
            test_cases=[{"expected_output": "sound\nwoof\n", "is_hidden": False}],
        ))

        # Q11: Generics
        advanced.append(self._create_quest(
            title="Fix generic list",
            description="Create a generic list. Fix the type.",
            level=3,
            initial_code='import java.util.ArrayList;\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<String> items = new ArrayList<>();\n        items.add("apple");\n        items.add(123);  // wrong type\n        System.out.println(items.get(0));\n    }\n}',
            solution_code='import java.util.ArrayList;\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<String> items = new ArrayList<>();\n        items.add("apple");\n        items.add("banana");\n        System.out.println(items.get(0));\n    }\n}',
            explanation="ArrayList<String> only accepts strings. Add \"banana\" not 123.",
            tags=["generics", "type safety"],
            test_cases=[{"expected_output": "apple\n", "is_hidden": False}],
        ))

        # Q12: Static methods
        advanced.append(self._create_quest(
            title="Fix static method usage",
            description="Use a static utility method. Fix the context.",
            level=3,
            initial_code='public class Utils {\n    static int double_val(int x) {\n        return x * 2;\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        int result = Utils.double_val(5);\n        System.out.println(result + 1);\n    }\n}',
            solution_code='public class Utils {\n    static int double_val(int x) {\n        return x * 2;\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        int result = Utils.double_val(5);\n        System.out.println(result);\n    }\n}',
            explanation="Static methods are called on the class. Remove the +1.",
            tags=["static", "methods"],
            test_cases=[{"expected_output": "10\n", "is_hidden": False}],
        ))

        # Q13: Interfaces
        advanced.append(self._create_quest(
            title="Fix interface implementation",
            description="Implement an interface correctly. Fix the method.",
            level=3,
            initial_code='interface Shape {\n    int area();\n}\npublic class Square implements Shape {\n    int side = 5;\n    public int area() {\n        return side * side * 2;  // wrong\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Square().area());\n    }\n}',
            solution_code='interface Shape {\n    int area();\n}\npublic class Square implements Shape {\n    int side = 5;\n    public int area() {\n        return side * side;\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Square().area());\n    }\n}',
            explanation="Area of square is side². You multiplied by 2 extra. Remove it.",
            tags=["interfaces", "contracts"],
            test_cases=[{"expected_output": "25\n", "is_hidden": False}],
        ))

        self._add_quests_by_level({1: basic, 2: intermediate, 3: advanced})

    # =========================================================================
    # C++ Curriculum
    # =========================================================================
    def _seed_cpp(self) -> None:
        """C++ curriculum: 4 basic + 5 intermediate + 4 advanced quests."""

        basic = []

        # Q1: Includes and output
        basic.append(self._create_quest(
            title="Fix C++ includes",
            description="Print 'hello'. Fix the include.",
            level=1,
            initial_code='// Missing include\nint main() {\n    std::cout << "hello" << std::endl;\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nint main() {\n    cout << "hello" << endl;\n    return 0;\n}',
            explanation="<iostream> provides cout. Always include it and use namespace std.",
            tags=["includes", "iostream"],
            test_cases=[{"expected_output": "hello\n", "is_hidden": False}],
        ))

        # Q2: Variables and arithmetic
        basic.append(self._create_quest(
            title="Fix integer arithmetic",
            description="Print 5 (2+3). Fix the calculation.",
            level=1,
            initial_code='#include <iostream>\nusing namespace std;\nint main() {\n    int a = 2;\n    int b = 3;\n    cout << a + b + 1 << endl;\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nint main() {\n    int a = 2;\n    int b = 3;\n    cout << a + b << endl;\n    return 0;\n}',
            explanation="Remove the extra +1 to get 5.",
            tags=["variables", "operators"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q3: Loops
        basic.append(self._create_quest(
            title="Fix for loop",
            description="Print 1, 2, 3. Fix the loop.",
            level=1,
            initial_code='#include <iostream>\nusing namespace std;\nint main() {\n    for (int i = 0; i < 3; i++) {\n        cout << i << endl;\n    }\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nint main() {\n    for (int i = 1; i <= 3; i++) {\n        cout << i << endl;\n    }\n    return 0;\n}',
            explanation="Start at 1 and use <= 3 to include 3.",
            tags=["loops", "for"],
            test_cases=[{"expected_output": "1\n2\n3\n", "is_hidden": False}],
        ))

        # Q4: Conditions
        basic.append(self._create_quest(
            title="Fix if condition",
            description="Check if 4 is even. Fix the condition.",
            level=1,
            initial_code='#include <iostream>\nusing namespace std;\nint main() {\n    int n = 4;\n    if (n % 2 == 1) {\n        cout << "even" << endl;\n    } else {\n        cout << "odd" << endl;\n    }\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nint main() {\n    int n = 4;\n    if (n % 2 == 0) {\n        cout << "even" << endl;\n    } else {\n        cout << "odd" << endl;\n    }\n    return 0;\n}',
            explanation="Even numbers have n % 2 == 0, not == 1.",
            tags=["conditions", "modulo"],
            test_cases=[{"expected_output": "even\n", "is_hidden": False}],
        ))

        intermediate = []

        # Q5: Vectors
        intermediate.append(self._create_quest(
            title="Fix vector usage",
            description="Create vector [1, 2, 3]. Fix the value.",
            level=2,
            initial_code='#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    vector<int> nums = {1, 2, 4};  // wrong\n    cout << nums[0] << endl;\n    return 0;\n}',
            solution_code='#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    vector<int> nums = {1, 2, 3};\n    cout << nums[0] << endl;\n    return 0;\n}',
            explanation="Vector is initialized with 4 instead of 3. Fix it.",
            tags=["vectors", "STL"],
            test_cases=[{"expected_output": "1\n", "is_hidden": False}],
        ))

        # Q6: Functions
        intermediate.append(self._create_quest(
            title="Fix function definition",
            description="Return sum of two numbers. Fix the operator.",
            level=2,
            initial_code='#include <iostream>\nusing namespace std;\nint add(int a, int b) {\n    return a - b;  // wrong\n}\nint main() {\n    cout << add(3, 2) << endl;\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nint add(int a, int b) {\n    return a + b;\n}\nint main() {\n    cout << add(3, 2) << endl;\n    return 0;\n}',
            explanation="Use + for addition, not -.",
            tags=["functions", "return"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q7: Structs
        intermediate.append(self._create_quest(
            title="Fix struct usage",
            description="Initialize a struct member. Fix the assignment.",
            level=2,
            initial_code='#include <iostream>\nusing namespace std;\nstruct Point {\n    int x;\n};\nint main() {\n    Point p;\n    p.x = 10 + 1;  // wrong\n    cout << p.x << endl;\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nstruct Point {\n    int x;\n};\nint main() {\n    Point p;\n    p.x = 10;\n    cout << p.x << endl;\n    return 0;\n}',
            explanation="Assign 10 directly, not 10+1.",
            tags=["structs", "members"],
            test_cases=[{"expected_output": "10\n", "is_hidden": False}],
        ))

        # Q8: Pointers
        intermediate.append(self._create_quest(
            title="Fix pointer basics",
            description="Dereference a pointer. Fix the operation.",
            level=2,
            initial_code='#include <iostream>\nusing namespace std;\nint main() {\n    int x = 5;\n    int *p = &x;\n    cout << p << endl;  // wrong: prints address\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nint main() {\n    int x = 5;\n    int *p = &x;\n    cout << *p << endl;  // dereference\n    return 0;\n}',
            explanation="*p dereferences to get the value (5), not the address.",
            tags=["pointers", "dereference"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q9: Arrays
        intermediate.append(self._create_quest(
            title="Fix array iteration",
            description="Sum first two elements. Fix the loop.",
            level=2,
            initial_code='#include <iostream>\nusing namespace std;\nint main() {\n    int arr[] = {10, 20, 30};\n    int sum = 0;\n    for (int i = 0; i < 3; i++) {  // wrong bound\n        sum += arr[i];\n    }\n    cout << sum << endl;\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nint main() {\n    int arr[] = {10, 20, 30};\n    int sum = 0;\n    for (int i = 0; i < 2; i++) {\n        sum += arr[i];\n    }\n    cout << sum << endl;\n    return 0;\n}',
            explanation="Loop only 2 times to sum first two elements (10+20=30).",
            tags=["arrays", "loops"],
            test_cases=[{"expected_output": "30\n", "is_hidden": False}],
        ))

        advanced = []

        # Q10: Dynamic memory
        advanced.append(self._create_quest(
            title="Fix memory allocation",
            description="Allocate and use dynamic memory. Fix the deletion.",
            level=3,
            initial_code='#include <iostream>\nusing namespace std;\nint main() {\n    int *p = new int(5);\n    cout << *p << endl;\n    // forgot to delete\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nint main() {\n    int *p = new int(5);\n    cout << *p << endl;\n    delete p;\n    return 0;\n}',
            explanation="new allocates memory, delete frees it. Always clean up.",
            tags=["memory", "dynamic"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q11: References
        advanced.append(self._create_quest(
            title="Fix reference usage",
            description="Modify via reference. Fix the syntax.",
            level=3,
            initial_code='#include <iostream>\nusing namespace std;\nint main() {\n    int x = 5;\n    int &ref = x;\n    ref = ref + 1;  // wrong operation\n    cout << x << endl;\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nint main() {\n    int x = 5;\n    int &ref = x;\n    ref = ref * 2;\n    cout << x << endl;\n    return 0;\n}',
            explanation="References alias variables. ref = ref * 2 doubles x.",
            tags=["references", "alias"],
            test_cases=[{"expected_output": "10\n", "is_hidden": False}],
        ))

        # Q12: Classes
        advanced.append(self._create_quest(
            title="Fix class methods",
            description="Implement a class with a method. Fix the return.",
            level=3,
            initial_code='#include <iostream>\nusing namespace std;\nclass Box {\npublic:\n    int getSize() const {\n        return 10 + 1;  // wrong\n    }\n};\nint main() {\n    Box b;\n    cout << b.getSize() << endl;\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\nclass Box {\npublic:\n    int getSize() const {\n        return 10;\n    }\n};\nint main() {\n    Box b;\n    cout << b.getSize() << endl;\n    return 0;\n}',
            explanation="Remove the +1 to return 10.",
            tags=["classes", "methods"],
            test_cases=[{"expected_output": "10\n", "is_hidden": False}],
        ))

        # Q13: Templates
        advanced.append(self._create_quest(
            title="Fix template function",
            description="Create generic max function. Fix the logic.",
            level=3,
            initial_code='#include <iostream>\nusing namespace std;\ntemplate <typename T>\nT maxVal(T a, T b) {\n    return a < b ? a : b;  // wrong logic\n}\nint main() {\n    cout << maxVal(5, 3) << endl;\n    return 0;\n}',
            solution_code='#include <iostream>\nusing namespace std;\ntemplate <typename T>\nT maxVal(T a, T b) {\n    return a > b ? a : b;\n}\nint main() {\n    cout << maxVal(5, 3) << endl;\n    return 0;\n}',
            explanation="Return a if a > b, not a < b. Reverse the comparison.",
            tags=["templates", "generics"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        self._add_quests_by_level({1: basic, 2: intermediate, 3: advanced})

    # =========================================================================
    # JavaScript Curriculum
    # =========================================================================
    def _seed_javascript(self) -> None:
        """JavaScript curriculum: 4 basic + 5 intermediate + 4 advanced quests."""

        basic = []

        # Q1: Console output
        basic.append(self._create_quest(
            title="Fix console.log",
            description="Print 'hello'. Fix the typo.",
            level=1,
            initial_code='console.lo("hello");  // typo',
            solution_code='console.log("hello");',
            explanation="console.log prints to output. You spelled it 'lo' instead of 'log'.",
            tags=["console", "output"],
            test_cases=[{"expected_output": "hello\n", "is_hidden": False}],
        ))

        # Q2: Variables and operators
        basic.append(self._create_quest(
            title="Fix variable arithmetic",
            description="Print 5 (2+3). Fix the operation.",
            level=1,
            initial_code='let a = 2;\nlet b = 3;\nconsole.log(a + b + 1);',
            solution_code='let a = 2;\nlet b = 3;\nconsole.log(a + b);',
            explanation="Remove the extra +1 to get 5.",
            tags=["variables", "operators"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q3: Loops
        basic.append(self._create_quest(
            title="Fix for loop",
            description="Print 1, 2, 3. Fix the range.",
            level=1,
            initial_code='for (let i = 0; i < 3; i++) {\n    console.log(i);\n}',
            solution_code='for (let i = 1; i <= 3; i++) {\n    console.log(i);\n}',
            explanation="Start at 1 and use <= 3 to include 3.",
            tags=["loops", "for"],
            test_cases=[{"expected_output": "1\n2\n3\n", "is_hidden": False}],
        ))

        # Q4: Conditions
        basic.append(self._create_quest(
            title="Fix if condition",
            description="Check if 4 is even. Fix the condition.",
            level=1,
            initial_code='let n = 4;\nif (n % 2 === 1) {\n    console.log("even");\n} else {\n    console.log("odd");\n}',
            solution_code='let n = 4;\nif (n % 2 === 0) {\n    console.log("even");\n} else {\n    console.log("odd");\n}',
            explanation="Even numbers have n % 2 === 0, not === 1.",
            tags=["conditions", "modulo"],
            test_cases=[{"expected_output": "even\n", "is_hidden": False}],
        ))

        intermediate = []

        # Q5: Functions
        intermediate.append(self._create_quest(
            title="Fix function return",
            description="Return sum of two numbers. Fix the operator.",
            level=2,
            initial_code='function add(a, b) {\n    return a - b;  // wrong\n}\nconsole.log(add(3, 2));',
            solution_code='function add(a, b) {\n    return a + b;\n}\nconsole.log(add(3, 2));',
            explanation="Use + for addition, not -.",
            tags=["functions", "return"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q6: Arrays
        intermediate.append(self._create_quest(
            title="Fix array operations",
            description="Create [1, 2, 3] by appending. Fix the value.",
            level=2,
            initial_code='let nums = [1, 2];\nnums.push(4);  // wrong\nconsole.log(nums);',
            solution_code='let nums = [1, 2];\nnums.push(3);\nconsole.log(nums);',
            explanation="push() adds to array. Use 3, not 4.",
            tags=["arrays", "push"],
            test_cases=[{"expected_output": "[ 1, 2, 3 ]\n", "is_hidden": False}],
        ))

        # Q7: Objects
        intermediate.append(self._create_quest(
            title="Fix object property access",
            description="Access object property. Fix the key.",
            level=2,
            initial_code='let obj = {x: 42, y: 10};\nconsole.log(obj["z"]);  // wrong key',
            solution_code='let obj = {x: 42, y: 10};\nconsole.log(obj["x"]);',
            explanation="Use key 'x' to get 42, not 'z'.",
            tags=["objects", "properties"],
            test_cases=[{"expected_output": "42\n", "is_hidden": False}],
        ))

        # Q8: String methods
        intermediate.append(self._create_quest(
            title="Fix string method",
            description="Get string length. Fix the method name.",
            level=2,
            initial_code='let str = "hello";\nconsole.log(str.len());  // wrong method',
            solution_code='let str = "hello";\nconsole.log(str.length);',
            explanation="Use .length property, not .len() method.",
            tags=["strings", "methods"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q9: Callbacks
        intermediate.append(self._create_quest(
            title="Fix callback function",
            description="Execute callback correctly. Fix the invocation.",
            level=2,
            initial_code='function executeCallback(callback) {\n    callback(5);  // forgot to call\n}\nlet result = 0;\nexecuteCallback((x) => {\n    result = x + 1;  // wrong\n});\nconsole.log(result);',
            solution_code='function executeCallback(callback) {\n    callback(5);\n}\nlet result = 0;\nexecuteCallback((x) => {\n    result = x;\n});\nconsole.log(result);',
            explanation="Assign x directly, not x+1.",
            tags=["callbacks", "functions"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        advanced = []

        # Q10: Closures
        advanced.append(self._create_quest(
            title="Fix closure",
            description="Create counter with closure. Fix the increment.",
            level=3,
            initial_code='function makeCounter() {\n    let count = 0;\n    return function() {\n        count = count + 2;  // wrong\n        return count;\n    };\n}\nlet counter = makeCounter();\nconsole.log(counter());',
            solution_code='function makeCounter() {\n    let count = 0;\n    return function() {\n        count = count + 1;\n        return count;\n    };\n}\nlet counter = makeCounter();\nconsole.log(counter());',
            explanation="Increment by 1, not 2.",
            tags=["closures", "scope"],
            test_cases=[{"expected_output": "1\n", "is_hidden": False}],
        ))

        # Q11: Promises
        advanced.append(self._create_quest(
            title="Fix promise resolution",
            description="Resolve promise with value. Fix the resolve call.",
            level=3,
            initial_code='let p = new Promise((resolve) => {\n    resolve(5 + 1);  // wrong\n});\np.then((x) => console.log(x));',
            solution_code='let p = new Promise((resolve) => {\n    resolve(5);\n});\np.then((x) => console.log(x));',
            explanation="Resolve with 5, not 5+1.",
            tags=["promises", "async"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q12: Object destructuring
        advanced.append(self._create_quest(
            title="Fix destructuring",
            description="Destructure object. Fix the extraction.",
            level=3,
            initial_code='let obj = {a: 10, b: 20};\nlet {a, b} = obj;\nconsole.log(a + b + 1);',
            solution_code='let obj = {a: 10, b: 20};\nlet {a, b} = obj;\nconsole.log(a + b);',
            explanation="Remove the +1 to get 30.",
            tags=["destructuring", "objects"],
            test_cases=[{"expected_output": "30\n", "is_hidden": False}],
        ))

        # Q13: Arrow functions
        advanced.append(self._create_quest(
            title="Fix arrow function",
            description="Use arrow function correctly. Fix the syntax.",
            level=3,
            initial_code='let nums = [1, 2, 3];\nlet doubled = nums.map((x) => x * 2 + 1);  // wrong\nconsole.log(doubled[0]);',
            solution_code='let nums = [1, 2, 3];\nlet doubled = nums.map((x) => x * 2);\nconsole.log(doubled[0]);',
            explanation="Map to x * 2, not x * 2 + 1.",
            tags=["arrow functions", "map"],
            test_cases=[{"expected_output": "2\n", "is_hidden": False}],
        ))

        self._add_quests_by_level({1: basic, 2: intermediate, 3: advanced})

    # =========================================================================
    # TypeScript Curriculum
    # =========================================================================
    def _seed_typescript(self) -> None:
        """TypeScript curriculum: 4 basic + 5 intermediate + 4 advanced quests."""

        basic = []

        # Q1: Type annotations
        basic.append(self._create_quest(
            title="Fix type annotation",
            description="Declare a typed variable. Fix the type.",
            level=1,
            initial_code='let x: string = "hello";\nconsole.log(x);',
            solution_code='let x: string = "hello";\nconsole.log(x);',
            explanation="Type annotations help catch errors. string type is correct.",
            tags=["types", "annotations"],
            test_cases=[{"expected_output": "hello\n", "is_hidden": False}],
        ))

        # Q2: Arithmetic with types
        basic.append(self._create_quest(
            title="Fix typed arithmetic",
            description="Add two numbers with type hints. Fix the operation.",
            level=1,
            initial_code='let a: number = 2;\nlet b: number = 3;\nconsole.log(a + b + 1);',
            solution_code='let a: number = 2;\nlet b: number = 3;\nconsole.log(a + b);',
            explanation="Remove the +1 to get 5.",
            tags=["types", "operators"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q3: Loops with types
        basic.append(self._create_quest(
            title="Fix typed loop",
            description="Loop 1 to 3 with type hints. Fix the range.",
            level=1,
            initial_code='for (let i: number = 0; i < 3; i++) {\n    console.log(i);\n}',
            solution_code='for (let i: number = 1; i <= 3; i++) {\n    console.log(i);\n}',
            explanation="Start at 1 and use <= 3.",
            tags=["loops", "types"],
            test_cases=[{"expected_output": "1\n2\n3\n", "is_hidden": False}],
        ))

        # Q4: Interfaces
        basic.append(self._create_quest(
            title="Fix interface property",
            description="Implement a simple interface. Fix the value.",
            level=1,
            initial_code='interface Box {\n    x: number;\n}\nlet b: Box = {x: 10 + 1};  // wrong\nconsole.log(b.x);',
            solution_code='interface Box {\n    x: number;\n}\nlet b: Box = {x: 10};\nconsole.log(b.x);',
            explanation="Assign 10 directly, not 10+1.",
            tags=["interfaces", "types"],
            test_cases=[{"expected_output": "10\n", "is_hidden": False}],
        ))

        intermediate = []

        # Q5: Functions with types
        intermediate.append(self._create_quest(
            title="Fix typed function",
            description="Function with parameters and return type. Fix the operator.",
            level=2,
            initial_code='function add(a: number, b: number): number {\n    return a - b;  // wrong\n}\nconsole.log(add(3, 2));',
            solution_code='function add(a: number, b: number): number {\n    return a + b;\n}\nconsole.log(add(3, 2));',
            explanation="Use + for addition.",
            tags=["functions", "types"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q6: Arrays with types
        intermediate.append(self._create_quest(
            title="Fix typed array",
            description="Array of numbers. Fix the value.",
            level=2,
            initial_code='let nums: number[] = [1, 2, 4];  // wrong\nconsole.log(nums[0]);',
            solution_code='let nums: number[] = [1, 2, 3];\nconsole.log(nums[0]);',
            explanation="Use 3, not 4.",
            tags=["arrays", "types"],
            test_cases=[{"expected_output": "1\n", "is_hidden": False}],
        ))

        # Q7: Generics
        intermediate.append(self._create_quest(
            title="Fix generic type",
            description="Create a generic container. Fix the type.",
            level=2,
            initial_code='interface Container<T> {\n    value: T;\n}\nlet c: Container<string> = {value: 42};  // wrong type\nconsole.log(c.value);',
            solution_code='interface Container<T> {\n    value: T;\n}\nlet c: Container<string> = {value: "hello"};\nconsole.log(c.value);',
            explanation="Container<string> needs a string, not 42.",
            tags=["generics", "types"],
            test_cases=[{"expected_output": "hello\n", "is_hidden": False}],
        ))

        # Q8: Union types
        intermediate.append(self._create_quest(
            title="Fix union type",
            description="Handle union types. Fix the logic.",
            level=2,
            initial_code='let x: string | number = 5;\nif (typeof x === "string") {\n    console.log(x.length);  // wrong type path\n} else {\n    console.log(x);\n}',
            solution_code='let x: string | number = 5;\nif (typeof x === "number") {\n    console.log(x);\n} else {\n    console.log(x.length);\n}',
            explanation="x is number, not string. Check typeof x === 'number'.",
            tags=["unions", "types"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q9: Enums
        intermediate.append(self._create_quest(
            title="Fix enum usage",
            description="Use an enum correctly. Fix the value.",
            level=2,
            initial_code='enum Color { Red = 0, Green = 1, Blue = 2 }\nlet c: Color = 3;  // wrong\nconsole.log(c);',
            solution_code='enum Color { Red = 0, Green = 1, Blue = 2 }\nlet c: Color = 1;\nconsole.log(c);',
            explanation="Use valid enum value 1, not 3.",
            tags=["enums", "types"],
            test_cases=[{"expected_output": "1\n", "is_hidden": False}],
        ))

        advanced = []

        # Q10: Advanced generics
        advanced.append(self._create_quest(
            title="Fix generic constraint",
            description="Constrain generic type. Fix the constraint.",
            level=3,
            initial_code='function getLength<T extends {length: number}>(x: T) {\n    return x.length + 1;  // wrong\n}\nconsole.log(getLength("hello"));',
            solution_code='function getLength<T extends {length: number}>(x: T) {\n    return x.length;\n}\nconsole.log(getLength("hello"));',
            explanation="Return length directly, not length+1.",
            tags=["generics", "constraints"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q11: Conditional types
        advanced.append(self._create_quest(
            title="Fix conditional type",
            description="Implement conditional type logic. Fix the branch.",
            level=3,
            initial_code='type IsString<T> = T extends string ? true : false;\nlet x: IsString<"hello"> = false;  // wrong\nconsole.log(x);',
            solution_code='type IsString<T> = T extends string ? true : false;\nlet x: IsString<"hello"> = true;\nconsole.log(x);',
            explanation="'hello' is a string, so result is true.",
            tags=["conditional types"],
            test_cases=[{"expected_output": "true\n", "is_hidden": False}],
        ))

        # Q12: Decorators
        advanced.append(self._create_quest(
            title="Fix decorator usage",
            description="Apply a decorator to a class. Fix the implementation.",
            level=3,
            initial_code='function logged(target: any) {\n    console.log("class created");  // wrong timing\n}\n@logged\nclass MyClass {}\nnew MyClass();',
            solution_code='function logged(target: any) {\n    console.log("class created");\n}\n@logged\nclass MyClass {}\nnew MyClass();',
            explanation="Decorator runs when class is defined.",
            tags=["decorators", "metaprogramming"],
            test_cases=[{"expected_output": "class created\n", "is_hidden": False}],
        ))

        # Q13: Utility types
        advanced.append(self._create_quest(
            title="Fix Readonly type",
            description="Make object properties readonly. Fix the mutation.",
            level=3,
            initial_code='type ReadonlyBox = Readonly<{x: number}>;\nlet b: ReadonlyBox = {x: 5};\nb.x = 10;  // error in TS, but we check logic\nconsole.log(b.x);',
            solution_code='type ReadonlyBox = Readonly<{x: number}>;\nlet b: ReadonlyBox = {x: 5};\nconsole.log(b.x);',
            explanation="Readonly prevents mutation. Don't try to reassign.",
            tags=["utility types", "readonly"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        self._add_quests_by_level({1: basic, 2: intermediate, 3: advanced})

    # =========================================================================
    # C Curriculum
    # =========================================================================
    def _seed_c(self) -> None:
        """C curriculum: 4 basic + 5 intermediate + 4 advanced quests."""

        basic = []

        # Q1: Printf
        basic.append(self._create_quest(
            title="Fix printf output",
            description="Print 'hello'. Fix the statement.",
            level=1,
            initial_code='#include <stdio.h>\nint main() {\n    printf("hello")  // missing semicolon and newline\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint main() {\n    printf("hello\\n");\n    return 0;\n}',
            explanation="Add semicolon and \\n for newline.",
            tags=["printf", "output"],
            test_cases=[{"expected_output": "hello\n", "is_hidden": False}],
        ))

        # Q2: Variables and arithmetic
        basic.append(self._create_quest(
            title="Fix integer math",
            description="Print 5 (2+3). Fix the operation.",
            level=1,
            initial_code='#include <stdio.h>\nint main() {\n    int a = 2;\n    int b = 3;\n    printf("%d\\n", a + b + 1);\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint main() {\n    int a = 2;\n    int b = 3;\n    printf("%d\\n", a + b);\n    return 0;\n}',
            explanation="Remove the +1 to get 5.",
            tags=["variables", "operators"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q3: Loops
        basic.append(self._create_quest(
            title="Fix for loop",
            description="Print 1, 2, 3. Fix the range.",
            level=1,
            initial_code='#include <stdio.h>\nint main() {\n    for (int i = 0; i < 3; i++) {\n        printf("%d\\n", i);\n    }\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint main() {\n    for (int i = 1; i <= 3; i++) {\n        printf("%d\\n", i);\n    }\n    return 0;\n}',
            explanation="Start at 1 and use <= 3.",
            tags=["loops", "for"],
            test_cases=[{"expected_output": "1\n2\n3\n", "is_hidden": False}],
        ))

        # Q4: Conditions
        basic.append(self._create_quest(
            title="Fix even check",
            description="Check if 4 is even. Fix the condition.",
            level=1,
            initial_code='#include <stdio.h>\nint main() {\n    int n = 4;\n    if (n % 2 == 1) {\n        printf("even\\n");\n    } else {\n        printf("odd\\n");\n    }\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint main() {\n    int n = 4;\n    if (n % 2 == 0) {\n        printf("even\\n");\n    } else {\n        printf("odd\\n");\n    }\n    return 0;\n}',
            explanation="Even: n % 2 == 0, not == 1.",
            tags=["conditions", "modulo"],
            test_cases=[{"expected_output": "even\n", "is_hidden": False}],
        ))

        intermediate = []

        # Q5: Functions
        intermediate.append(self._create_quest(
            title="Fix function return",
            description="Return sum of parameters. Fix the operator.",
            level=2,
            initial_code='#include <stdio.h>\nint add(int a, int b) {\n    return a - b;  // wrong\n}\nint main() {\n    printf("%d\\n", add(3, 2));\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint add(int a, int b) {\n    return a + b;\n}\nint main() {\n    printf("%d\\n", add(3, 2));\n    return 0;\n}',
            explanation="Use + for addition.",
            tags=["functions", "return"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q6: Arrays
        intermediate.append(self._create_quest(
            title="Fix array indexing",
            description="Access first element. Fix the index.",
            level=2,
            initial_code='#include <stdio.h>\nint main() {\n    int arr[] = {10, 20, 30};\n    printf("%d\\n", arr[1]);\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint main() {\n    int arr[] = {10, 20, 30};\n    printf("%d\\n", arr[0]);\n    return 0;\n}',
            explanation="Arrays are zero-indexed. Index 0 is first.",
            tags=["arrays", "indexing"],
            test_cases=[{"expected_output": "10\n", "is_hidden": False}],
        ))

        # Q7: Pointers basics
        intermediate.append(self._create_quest(
            title="Fix pointer dereference",
            description="Get value via pointer. Fix the dereference.",
            level=2,
            initial_code='#include <stdio.h>\nint main() {\n    int x = 5;\n    int *p = &x;\n    printf("%p\\n", p);  // prints address, wrong\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint main() {\n    int x = 5;\n    int *p = &x;\n    printf("%d\\n", *p);\n    return 0;\n}',
            explanation="*p dereferences to get the value 5.",
            tags=["pointers", "dereference"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q8: Strings
        intermediate.append(self._create_quest(
            title="Fix string declaration",
            description="Declare a string. Fix the initialization.",
            level=2,
            initial_code='#include <stdio.h>\nint main() {\n    char *str = "hello";\n    printf("%s\\n", str);  // correct, but test value\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint main() {\n    char *str = "hello";\n    printf("%s\\n", str);\n    return 0;\n}',
            explanation="String pointers store text.",
            tags=["strings", "pointers"],
            test_cases=[{"expected_output": "hello\n", "is_hidden": False}],
        ))

        # Q9: Structs
        intermediate.append(self._create_quest(
            title="Fix struct member access",
            description="Access struct field. Fix the value.",
            level=2,
            initial_code='#include <stdio.h>\nstruct Point {\n    int x;\n};\nint main() {\n    struct Point p;\n    p.x = 10 + 1;  // wrong\n    printf("%d\\n", p.x);\n    return 0;\n}',
            solution_code='#include <stdio.h>\nstruct Point {\n    int x;\n};\nint main() {\n    struct Point p;\n    p.x = 10;\n    printf("%d\\n", p.x);\n    return 0;\n}',
            explanation="Assign 10 directly.",
            tags=["structs", "members"],
            test_cases=[{"expected_output": "10\n", "is_hidden": False}],
        ))

        advanced = []

        # Q10: Dynamic allocation
        advanced.append(self._create_quest(
            title="Fix malloc usage",
            description="Allocate memory for integer. Fix the allocation.",
            level=3,
            initial_code='#include <stdio.h>\n#include <stdlib.h>\nint main() {\n    int *p = (int *)malloc(sizeof(int));\n    *p = 5;\n    printf("%d\\n", *p);\n    // forgot free(p);\n    return 0;\n}',
            solution_code='#include <stdio.h>\n#include <stdlib.h>\nint main() {\n    int *p = (int *)malloc(sizeof(int));\n    *p = 5;\n    printf("%d\\n", *p);\n    free(p);\n    return 0;\n}',
            explanation="Always free() memory allocated with malloc().",
            tags=["memory", "malloc"],
            test_cases=[{"expected_output": "5\n", "is_hidden": False}],
        ))

        # Q11: Pointer arithmetic
        advanced.append(self._create_quest(
            title="Fix pointer arithmetic",
            description="Increment pointer. Fix the operation.",
            level=3,
            initial_code='#include <stdio.h>\nint main() {\n    int arr[] = {10, 20, 30};\n    int *p = arr;\n    p = p + 2;  // skip to index 2\n    printf("%d\\n", *p);\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint main() {\n    int arr[] = {10, 20, 30};\n    int *p = arr;\n    p = p + 2;\n    printf("%d\\n", *p);\n    return 0;\n}',
            explanation="p+2 moves pointer 2 positions forward.",
            tags=["pointers", "arithmetic"],
            test_cases=[{"expected_output": "30\n", "is_hidden": False}],
        ))

        # Q12: Recursion
        advanced.append(self._create_quest(
            title="Fix recursive function",
            description="Compute factorial. Fix the base case.",
            level=3,
            initial_code='#include <stdio.h>\nint factorial(int n) {\n    if (n <= 0) return 1;\n    return n * factorial(n - 1);\n}\nint main() {\n    printf("%d\\n", factorial(0) + 1);  // wrong\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint factorial(int n) {\n    if (n <= 0) return 1;\n    return n * factorial(n - 1);\n}\nint main() {\n    printf("%d\\n", factorial(0));\n    return 0;\n}',
            explanation="factorial(0) = 1. Don't add 1.",
            tags=["recursion", "functions"],
            test_cases=[{"expected_output": "1\n", "is_hidden": False}],
        ))

        # Q13: File I/O
        advanced.append(self._create_quest(
            title="Fix file operations",
            description="Read/write concept. Fix the mode.",
            level=3,
            initial_code='#include <stdio.h>\nint main() {\n    FILE *f = fopen("test.txt", "r");  // read mode\n    // fprintf(f, "hello");  // can\'t write in read mode\n    fprintf(f, "hello\\n");  // this would fail in actual execution\n    fclose(f);\n    return 0;\n}',
            solution_code='#include <stdio.h>\nint main() {\n    FILE *f = fopen("test.txt", "w");\n    fprintf(f, "hello\\n");\n    fclose(f);\n    printf("OK\\n");\n    return 0;\n}',
            explanation="Use 'w' mode to write. Change the output for testing.",
            tags=["file I/O", "FILE"],
            test_cases=[{"expected_output": "OK\n", "is_hidden": False}],
        ))

        self._add_quests_by_level({1: basic, 2: intermediate, 3: advanced})


def seed_full_curriculum(session: Session) -> None:
    """
    Seed all curriculum quests for supported languages.
    This is the main entry point for curriculum seeding.
    """
    languages = ["python", "java", "cpp", "javascript", "typescript", "c"]
    base_ranks = {
        "python": 1000,
        "java": 2000,
        "cpp": 3000,
        "javascript": 4000,
        "typescript": 5000,
        "c": 6000,
    }

    for lang in languages:
        gen = CurriculumGenerator(
            session=session,
            language=lang,
            base_order_rank=base_ranks[lang],
        )
        gen.seed_curriculum()
        print(f"✓ Ensured {lang} curriculum")

    print(f"\nTotal: {len(languages) * 13} quests + {len(languages) * 2} checkpoints seeded")


if __name__ == "__main__":
    import os
    import sys
    from pathlib import Path

    # Setup path
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

    # Load .env
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    database_url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get("DATABASE_URL", "").replace(
        "postgresql+asyncpg://", "postgresql+psycopg://", 1
    )
    if not database_url:
        print("Set DATABASE_URL or DATABASE_URL_SYNC")
        sys.exit(1)

    engine = create_engine(database_url)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    try:
        seed_full_curriculum(session)
        session.commit()
        print("✓ Curriculum seeded successfully")
    except Exception as e:
        session.rollback()
        print(f"✗ Error: {e}")
        raise
    finally:
        session.close()
