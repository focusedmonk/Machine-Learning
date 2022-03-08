# NOTE: The application has to be configured only once to setup the work environment.
import json
import os
from zipfile import ZipFile
from pathlib import Path
from Utils import *

cwd = os.getcwd()
root_path = Path(cwd).parent
data_path = Path.joinpath(root_path, 'data')

# Installing python packages
print('- Installing python packages...')
os.system('pip install -r ../requirements.txt --user')

# Setting the absolute path for the source excel file, and the location to store the training data.
print('- Configuring the absolute paths...')
config_settings_file = '../Settings.json'
settings_json = read_json_file(config_settings_file)
settings_json['ExcelData'] = str(Path.joinpath(data_path, '<excel_filename>.xlsx'))
settings_json['TrainingInputPath'] = str(Path.joinpath(data_path, 'Train_'))
settings_json['TrainingOutputPath'] = str(data_path)
with open(config_settings_file, 'w') as f:
    f.write(json.dumps(settings_json, indent=4))

# Configuring the UI tool.
ui_config_settings_file = '../UI Tool/configuration/settings.json'
ui_settings_json = read_json_file(ui_config_settings_file)
ui_settings_json['LocalAppDirectory'] = str(Path.joinpath(root_path, 'frontend', 'NLP', 'index.html'))
with open(ui_config_settings_file, 'w') as f:
    f.write(json.dumps(ui_settings_json, indent=4))

# Github doesn't allow file size > 100MB. Therefore, the exe file is compressed to zip and committed to main branch.
# Extract the zip file while configuring the application for the first time.
zip_file_path = '../UI Tool/UI Tool.zip'
if os.path.exists(zip_file_path):
    with ZipFile(zip_file_path, 'r') as zip_file:
        error = False
        try:
            zip_file.extractall(path='../UI Tool')
            print('- UI tool application file unzipped successfully...')
        except:
            error = True
            print('- UI tool application file unzip failed!')
    if not error:
        os.remove(zip_file_path)
