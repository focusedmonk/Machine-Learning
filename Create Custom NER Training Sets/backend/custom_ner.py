import spacy
from spacy.language import Language

# Initialise spacy model
nlp = spacy.load("en_core_web_sm")


@Language.component('identify_new_line')
def identify_new_line(doc):
    for token in doc:
        if token.text == '\n':
            token.is_sent_start = True
    return doc


# Add pipes
nlp.add_pipe('sentencizer')
# nlp.add_pipe('identify_new_line')


def get_doc_entities(text):
    doc = nlp(text)
    return doc.to_json()
