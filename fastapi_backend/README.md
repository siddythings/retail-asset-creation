# Model Generation Backend

This backend handles model generation services for the retail asset creation platform.

## Features

- Model generation with Leonardo.ai API
- Reference image analysis
- NLP-based attribute detection for intelligent prompt building
- Gallery management

## Setup

1. Install the required dependencies:
```
pip install -r requirements.txt
```

2. Set up the NLP components:
```
python setup_nlp.py
```

3. Set the environment variables (see `.env.example`).

4. Run the application:
```
uvicorn app.main:app --reload
```

## NLP-Based Attribute Detection

The system uses Natural Language Processing (NLP) to intelligently detect when model attributes are mentioned in user prompts or reference image descriptions. This approach offers several advantages over the previous substring matching:

### Key Features

- **Contextual Understanding**: Recognizes attributes based on context, not just exact matches
- **Advanced Pattern Matching**: Uses SpaCy's matcher capabilities to detect various ways attributes might be expressed
- **Entity Recognition**: Utilizes named entity recognition to find relevant attributes

### How It Works

1. The system processes the user's prompt and reference image description through a SpaCy NLP pipeline
2. Attribute detectors use both phrase matching and rule-based matching to identify when attributes are mentioned
3. Results are logged and used to determine which UI-selected attributes should be added to the final prompt
4. Only attributes that aren't already mentioned in the user's prompt are added from the UI selections

### Examples

- If a user types "a model with green eyes," the system will automatically detect this as specifying eye color, even if they've selected a different eye color in the UI
- If a prompt mentions "a slim woman," the body size attribute will be detected and the UI-selected body size won't be added

### Extending the Detection

The NLP detector can be extended with additional patterns and rules by modifying the `nlp_attribute_detector.py` file. 