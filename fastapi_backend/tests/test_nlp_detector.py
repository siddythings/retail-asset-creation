"""
Tests for the NLP-based attribute detector.
"""
import unittest
import logging
import sys
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.nlp_attribute_detector import attribute_detector

class TestNLPAttributeDetector(unittest.TestCase):
    """Test cases for the NLP attribute detector."""
    
    def test_eye_color_detection(self):
        """Test detection of eye color in prompts."""
        # Simple cases
        self.assertTrue(attribute_detector.detect_attributes("a woman with blue eyes")["eye_color"])
        self.assertTrue(attribute_detector.detect_attributes("her green eyes sparkle")["eye_color"])
        self.assertTrue(attribute_detector.detect_attributes("a model who has brown eyes")["eye_color"])
        
        # More complex cases
        self.assertTrue(attribute_detector.detect_attributes("she stares intensely with her hazel colored eyes")["eye_color"])
        self.assertTrue(attribute_detector.detect_attributes("eyes of deep blue that shine in the light")["eye_color"])
        
        # Negative cases
        self.assertFalse(attribute_detector.detect_attributes("a beautiful dress")["eye_color"])
        self.assertFalse(attribute_detector.detect_attributes("standing in front of blue sky")["eye_color"])
    
    def test_body_size_detection(self):
        """Test detection of body size in prompts."""
        # Simple cases
        self.assertTrue(attribute_detector.detect_attributes("a thin woman")["body_size"])
        self.assertTrue(attribute_detector.detect_attributes("with a slim figure")["body_size"])
        self.assertTrue(attribute_detector.detect_attributes("plus-size model")["body_size"])
        
        # More complex cases
        self.assertTrue(attribute_detector.detect_attributes("she has an average build and is wearing a dress")["body_size"])
        self.assertTrue(attribute_detector.detect_attributes("with her curvy figure highlighted by the outfit")["body_size"])
        
        # Negative cases
        self.assertFalse(attribute_detector.detect_attributes("wearing a slim-fit dress")["body_size"])
        self.assertFalse(attribute_detector.detect_attributes("standing on a thin carpet")["body_size"])
    
    def test_skin_color_detection(self):
        """Test detection of skin color in prompts."""
        attribute_detector = NLPAttributeDetector()
        
        # Positive tests
        self.assertTrue(attribute_detector.detect_attributes("a model with fair skin")["skin_color"])
        self.assertTrue(attribute_detector.detect_attributes("light skin")["skin_color"])
        self.assertTrue(attribute_detector.detect_attributes("a person with medium complexion")["skin_color"])
        self.assertTrue(attribute_detector.detect_attributes("dark-skinned woman")["skin_color"])
        
        # Negative tests - shouldn't match these
        self.assertFalse(attribute_detector.detect_attributes("wearing a light blue dress")["skin_color"])
        self.assertFalse(attribute_detector.detect_attributes("with tan colored shoes")["skin_color"])
    
    def test_age_detection(self):
        """Test detection of age in prompts."""
        # Simple cases
        self.assertTrue(attribute_detector.detect_attributes("a young woman")["age"])
        self.assertTrue(attribute_detector.detect_attributes("in her twenties")["age"])
        self.assertTrue(attribute_detector.detect_attributes("a middle-aged woman")["age"])
        
        # More complex cases
        self.assertTrue(attribute_detector.detect_attributes("she appears to be in her early thirties")["age"])
        self.assertTrue(attribute_detector.detect_attributes("an elderly woman with a confident pose")["age"])
        
        # Negative cases
        self.assertFalse(attribute_detector.detect_attributes("wearing a dress from the twenties")["age"])
        self.assertFalse(attribute_detector.detect_attributes("with young plants in the background")["age"])
    
    def test_multiple_attributes(self):
        """Test detection of multiple attributes in a single prompt."""
        results = attribute_detector.detect_attributes(
            "a young asian woman with green eyes and a slim figure wearing a red dress"
        )
        self.assertTrue(results["age"])
        self.assertTrue(results["eye_color"])
        self.assertTrue(results["body_size"])
    
    def test_context_extraction(self):
        """Test extraction of context around attribute mentions."""
        contexts = attribute_detector.get_context_for_attribute(
            "a young woman with striking blue eyes wearing a casual outfit",
            "eye_color"
        )
        self.assertTrue(any("blue eyes" in context for context in contexts))

if __name__ == "__main__":
    unittest.main() 