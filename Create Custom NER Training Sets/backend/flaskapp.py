from flask import Flask, request
from flask_cors import CORS
from sqlalchemy import *
import pandas as pd
import datetime
import uuid
import json
import os
from custom_ner import *
from Utils import read_json_file

app = Flask(__name__)
CORS(app)

settings = read_json_file('../Settings.json')
use_cols = settings['UseCols']
if len(use_cols) == 0:
    df = pd.read_excel(settings['ExcelData'], engine='openpyxl', sheet_name=settings['SheetName'])
    use_cols = list(df.columns)

# Setting up database
engine = create_engine('sqlite:///' + settings['DbName'], echo=False)
insp = inspect(engine)
metadata = MetaData(engine)
table_args = ['annotation', metadata, Column('index', Integer()), Column('unique_id', String())]
db_cols = list(map(lambda col: Column(col, String(), nullable=True), use_cols))
table_args.extend(db_cols)
table_args.append(Column('biluo_annotation', String(), nullable=True))
table_args.append(Column('non_biluo_annotation', String(), nullable=True))
annotation = Table(*table_args)


@app.route('/')
def get_started():
    return 'Welcome!'


@app.route('/load_db')
def load_db():
    if not insp.has_table('annotation'):
        annotation.create(engine)
    excel_data = pd.read_excel(settings['ExcelData'],
                               engine='openpyxl',
                               sheet_name=settings['SheetName'],
                               usecols=use_cols)
    excel_data['unique_id'] = [str(uuid.uuid4()) for i in range(len(excel_data))]
    db_cols_to_create = ['unique_id']
    db_cols_to_create.extend(use_cols)
    excel_data[db_cols_to_create].to_sql('annotation', con=engine, if_exists='append')
    return 'Database loaded successfully!'


@app.route('/get_entities', methods=['POST'])
def get_entities():
    return get_doc_entities(request.form['text'])


@app.route('/get_conclusion_list')
def get_conclusion_list():
    df = pd.read_sql_table('annotation', engine)
    return df.to_json()


@app.route('/save_annotation', methods=['POST'])
def save_annotation():
    raw_data = json.loads(request.form['json'])
    unique_id = raw_data['uniqueId']
    biluo_annotation = json.dumps(raw_data['biluoFrmt'])
    non_biluo_annotation = json.dumps(raw_data['nonBiluoFrmt'])
    sql = (update(annotation).where(annotation.c.unique_id == unique_id).values(
        biluo_annotation=biluo_annotation,
        non_biluo_annotation=non_biluo_annotation
    ))
    with engine.begin() as conn:
        conn.execute(sql)
    return 'Success'


@app.route('/delete_annotation', methods=['POST'])
def delete_annotation():
    raw_data = json.loads(request.form['json'])
    unique_id = raw_data['uniqueId']
    delete_type = raw_data['type']
    if delete_type == 1:
        sql = delete(annotation).where(annotation.c.unique_id == unique_id)
    elif delete_type == 2:
        sql = (update(annotation).where(annotation.c.unique_id == unique_id).values(
            biluo_annotation=None,
            non_biluo_annotation=None
        ))
    with engine.begin() as conn:
        conn.execute(sql)
    return 'Success'


@app.route('/create_training_data')
def create_training_data():
    df = pd.read_sql_table('annotation', engine)
    dts = str(datetime.datetime.now()).split('.')[0]
    dts = dts.replace(r':', '_').replace(' ', '_')
    dataset_type = request.args.get('type', default=1, type=int)

    # BILUO format training data
    if dataset_type == 1:
        list_of_annotations = df[df.biluo_annotation.notnull()].biluo_annotation.values
        training_json_file = settings['TrainingInputPath'] + dts + '_BILUO.json'
        annot_bin = []
        for i, ann in enumerate(list_of_annotations):
            json_data = json.loads(ann)
            json_data['id'] = i
            annot_bin.append(json_data)
        with open(training_json_file, 'w') as f:
            f.write(json.dumps(annot_bin))
        os.system('python -m spacy convert "' + training_json_file + '" "' + settings['TrainingOutputPath'] + '"')

    # (start_pos, end_pos, label) format training data
    if dataset_type == 2:
        list_of_annotations = df[df.non_biluo_annotation.notnull()].non_biluo_annotation.values
        training_json_file = settings['TrainingInputPath'] + dts + '.json'
        annot_bin = [json.loads(ann) for ann in list_of_annotations]
        with open(training_json_file, 'w') as f:
            f.write(json.dumps(annot_bin))
    return 'Success'


if __name__ == '__main__':
    app.run(port=settings['PyPort'])
