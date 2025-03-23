#!/usr/bin/env python
"""
Setup script to download required SpaCy models for NLP-based attribute detection.
Run this script before starting the application for the first time.
"""

import subprocess
import sys
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def install_spacy_models():
    """Install required SpaCy models."""
    logger.info("Installing SpaCy models...")
    
    # Try to install the medium model first
    try:
        subprocess.check_call([
            sys.executable, "-m", "spacy", "download", "en_core_web_md"
        ])
        logger.info("Successfully installed en_core_web_md")
    except subprocess.CalledProcessError:
        logger.warning("Failed to install en_core_web_md, trying fallback model")
        
        # Try to install the small model as a fallback
        try:
            subprocess.check_call([
                sys.executable, "-m", "spacy", "download", "en_core_web_sm"
            ])
            logger.info("Successfully installed en_core_web_sm")
        except subprocess.CalledProcessError:
            logger.error("Failed to install any SpaCy model. NLP-based attribute detection may not work properly.")
            return False
    
    return True

if __name__ == "__main__":
    logger.info("Setting up NLP components...")
    
    if install_spacy_models():
        logger.info("NLP setup completed successfully")
    else:
        logger.error("NLP setup failed") 