export type ConceptResource = {
  label: string;
  url: string;
  source?: string;
};

function norm(s: string): string {
  return (s ?? "").trim().toLowerCase();
}

// Curated, stable links (official docs + ATBS).
// Keys are normalized quest tags / concept labels.
const CONCEPT_RESOURCES: Record<string, ConceptResource[]> = {
  variables: [
    {
      label: "Assignment statements (Python reference)",
      url: "https://docs.python.org/3/reference/simple_stmts.html#assignment-statements",
      source: "Python docs",
    },
    {
      label: "Chapter 1: Basics (Automate the Boring Stuff)",
      url: "https://automatetheboringstuff.com/2e/chapter1/",
      source: "ATBS",
    },
  ],
  arithmetic: [
    {
      label: "Numbers (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/introduction.html#numbers",
      source: "Python docs",
    },
    {
      label: "Chapter 1: Basics (ATBS)",
      url: "https://automatetheboringstuff.com/2e/chapter1/",
      source: "ATBS",
    },
  ],
  loops: [
    {
      label: "for statements (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/controlflow.html#for-statements",
      source: "Python docs",
    },
    {
      label: "while statements (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/controlflow.html#while-statements",
      source: "Python docs",
    },
    {
      label: "Chapter 2: Flow Control (ATBS)",
      url: "https://automatetheboringstuff.com/2e/chapter2/",
      source: "ATBS",
    },
  ],
  range: [
    {
      label: "range() (built-in functions)",
      url: "https://docs.python.org/3/library/functions.html#func-range",
      source: "Python docs",
    },
    {
      label: "for statements (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/controlflow.html#for-statements",
      source: "Python docs",
    },
  ],
  conditions: [
    {
      label: "if statements (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/controlflow.html#if-statements",
      source: "Python docs",
    },
    {
      label: "Chapter 2: Flow Control (ATBS)",
      url: "https://automatetheboringstuff.com/2e/chapter2/",
      source: "ATBS",
    },
  ],
  modulo: [
    {
      label: "Arithmetic conversions & operations (Python reference)",
      url: "https://docs.python.org/3/reference/expressions.html#binary-arithmetic-operations",
      source: "Python docs",
    },
  ],
  functions: [
    {
      label: "Defining functions (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions",
      source: "Python docs",
    },
    {
      label: "Chapter 3: Functions (ATBS)",
      url: "https://automatetheboringstuff.com/2e/chapter3/",
      source: "ATBS",
    },
  ],
  return: [
    {
      label: "The return statement (Python reference)",
      url: "https://docs.python.org/3/reference/simple_stmts.html#the-return-statement",
      source: "Python docs",
    },
  ],
  lists: [
    {
      label: "More on lists (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists",
      source: "Python docs",
    },
    {
      label: "Chapter 4: Lists (ATBS)",
      url: "https://automatetheboringstuff.com/2e/chapter4/",
      source: "ATBS",
    },
  ],
  append: [
    {
      label: "list.append (standard types)",
      url: "https://docs.python.org/3/library/stdtypes.html#list.append",
      source: "Python docs",
    },
    {
      label: "More on lists (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists",
      source: "Python docs",
    },
  ],
  strings: [
    {
      label: "Strings (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/introduction.html#strings",
      source: "Python docs",
    },
    {
      label: "str (standard types)",
      url: "https://docs.python.org/3/library/stdtypes.html#text-sequence-type-str",
      source: "Python docs",
    },
    {
      label: "Chapter 6: Manipulating Strings (ATBS)",
      url: "https://automatetheboringstuff.com/2e/chapter6/",
      source: "ATBS",
    },
  ],
  concatenation: [
    {
      label: "Strings (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/introduction.html#strings",
      source: "Python docs",
    },
  ],
  dict: [
    {
      label: "Dictionaries (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries",
      source: "Python docs",
    },
    {
      label: "dict (standard types)",
      url: "https://docs.python.org/3/library/stdtypes.html#mapping-types-dict",
      source: "Python docs",
    },
    {
      label: "Chapter 5: Dictionaries (ATBS)",
      url: "https://automatetheboringstuff.com/2e/chapter5/",
      source: "ATBS",
    },
  ],
  dictionary: [
    {
      label: "Dictionaries (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries",
      source: "Python docs",
    },
    {
      label: "Chapter 5: Dictionaries (ATBS)",
      url: "https://automatetheboringstuff.com/2e/chapter5/",
      source: "ATBS",
    },
  ],
  lookup: [
    {
      label: "Mapping types — dict (standard types)",
      url: "https://docs.python.org/3/library/stdtypes.html#mapping-types-dict",
      source: "Python docs",
    },
  ],
  exceptions: [
    {
      label: "Errors and Exceptions (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/errors.html",
      source: "Python docs",
    },
    {
      label: "Chapter 10: Debugging (ATBS)",
      url: "https://automatetheboringstuff.com/2e/chapter10/",
      source: "ATBS",
    },
  ],
  division: [
    {
      label: "Numbers (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/introduction.html#numbers",
      source: "Python docs",
    },
    {
      label: "Built-in exceptions (ZeroDivisionError)",
      url: "https://docs.python.org/3/library/exceptions.html#ZeroDivisionError",
      source: "Python docs",
    },
  ],
  "type conversion": [
    {
      label: "Built-in functions (int, str, float, ...)",
      url: "https://docs.python.org/3/library/functions.html",
      source: "Python docs",
    },
    {
      label: "Chapter 1: Basics (ATBS)",
      url: "https://automatetheboringstuff.com/2e/chapter1/",
      source: "ATBS",
    },
  ],
  int: [
    {
      label: "int() (built-in functions)",
      url: "https://docs.python.org/3/library/functions.html#int",
      source: "Python docs",
    },
    {
      label: "Numeric types (standard types)",
      url: "https://docs.python.org/3/library/stdtypes.html#numeric-types-int-float-complex",
      source: "Python docs",
    },
  ],
  debugging: [
    {
      label: "pdb — The Python Debugger",
      url: "https://docs.python.org/3/library/pdb.html",
      source: "Python docs",
    },
    {
      label: "Python Tutor (visualize execution)",
      url: "https://pythontutor.com/visualize.html#mode=edit",
      source: "Python Tutor",
    },
  ],
  "error handling": [
    {
      label: "Errors and Exceptions (Python tutorial)",
      url: "https://docs.python.org/3/tutorial/errors.html",
      source: "Python docs",
    },
  ],
  "best practices": [
    {
      label: "PEP 8 — Style Guide for Python Code",
      url: "https://peps.python.org/pep-0008/",
      source: "PEP",
    },
  ],
};

export function getResourcesForConcept(concept: string): ConceptResource[] {
  const key = norm(concept);
  return CONCEPT_RESOURCES[key] ?? [];
}

export function getBestUrlForConcept(concept: string): string {
  const resources = getResourcesForConcept(concept);
  if (resources.length > 0) return resources[0].url;
  return `https://www.google.com/search?q=${encodeURIComponent(`python ${concept}`)}`;
}

export function getAggregatedResources(concepts: string[]): ConceptResource[] {
  const seen = new Set<string>();
  const out: ConceptResource[] = [];

  for (const c of concepts ?? []) {
    for (const r of getResourcesForConcept(c)) {
      if (!seen.has(r.url)) {
        seen.add(r.url);
        out.push(r);
      }
    }
  }

  return out;
}

