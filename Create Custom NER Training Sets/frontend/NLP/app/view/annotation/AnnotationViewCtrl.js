Ext.define('NLP.view.annotation.AnnotationViewCtrl', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.annotateviewctrl',

    listen: {
        component: {
			'#labelFilterText': {
                change: {
                    buffer: 300,
                    fn: 'filterLabels'
                }
            },
            '#rawDataGrid': {
                boxready: 'onRawDataGridReady',
                expand: 'onExpandRawDataGrid',
                celldblclick: 'onCellDblClick'
            },
            '#annotateViewCntr': {
                expand: 'onExpandAnnotateView'
            }
        },
        controller: {
            '*': {
                updateentitylabels: 'setEntityLabels'
            }
        }
    },

    filterLabels: function (field) {
        var me = this;
        me.setEntityLabels(field.getValue());
    },
	
	setEntityLabels: function (labelFltrTxt) {
        labelFltrTxt = labelFltrTxt && labelFltrTxt.toLowerCase().trim(); // case-insensitive filtering
        var me = this,
            annotateView = me.getView(),
            labelContainer = annotateView.down('#labelContainer'),
            defaultLablSelctd = false,
            primaryLabels = Ext.Object.getKeys(annotateView.annotationLabels).map(function (ent) {
                var labelCls = ['entity-label'],
                    longText = annotateView.annotationLabels[ent];
                if (labelFltrTxt && ent.toLowerCase().indexOf(labelFltrTxt) === -1 && longText.toLowerCase().indexOf(labelFltrTxt) === -1) {
                    return null;
                }
                if (!defaultLablSelctd) { // By default select 1st label.
                    labelCls.push('entity-selected');
                    defaultLablSelctd = true;
                }
                if (annotateView.labelPanelAlign === 'vertical') {
                    labelCls.push('entity-label-v');
                    if (longText) {
                        return '<div class="' + labelCls.join(' ') + '">' + longText + ' </br>(' + ent + ')</div>';
                    }
                    return '<div class="' + labelCls.join(' ') + '">' + ' (' + ent + ')</div>';
                } else {
                    return '<span class="' + labelCls.join(' ') + '">' + longText + '</span>';
                }
            }).removeEmptyValues(),
            entityLabel;
        labelContainer.setHtml(primaryLabels.length ? primaryLabels.join('') : '<div style="text-align:center;">No labels to display!</div>');
        entityLabel = labelContainer.el.down('.entity-selected');
        if (entityLabel) {
            entityLabel = entityLabel.dom.textContent;
            if (annotateView.labelPanelAlign === 'vertical') {
                entityLabel = entityLabel.substring(entityLabel.indexOf('(') + 1, entityLabel.indexOf(')'));
            }
            me.fireEvent('updateentitylabel', entityLabel);
            labelContainer.el.query('.entity-label').forEach(function (labelTag) {
                Ext.get(labelTag).el.on('click', me.selectLabel.bind(me, labelTag));
            });
        }
    },

    selectLabel: function (labelTag) {
        var me = this,
            annotateView = me.getView(),
            entityLabel = labelTag.textContent;
        if (annotateView.labelPanelAlign === 'vertical') {
            entityLabel = labelTag.textContent.substring(labelTag.textContent.indexOf('(') + 1, labelTag.textContent.indexOf(')'));
        }
        labelTag.parentNode.querySelector('.entity-selected').classList.remove('entity-selected');
        labelTag.classList.add('entity-selected');
        me.fireEvent('updateentitylabel', entityLabel);
    },

    onCellDblClick: function (table, td, cellIndex, record) {
		var clickedDataIndex = table.panel.headerCt.getHeaderAtIndex(cellIndex).dataIndex,
			clickedCellValue = record.get(clickedDataIndex),
			textArea = document.createElement('textarea');
		textArea.value = clickedCellValue;
		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand("copy");
		document.body.removeChild(textArea);
	},

    onExpandRawDataGrid: function () {
        var me = this,
            view = me.getView(),
            annotateViewCntr = view.down('#annotateViewCntr');
        annotateViewCntr.collapse();
    },

    onExpandAnnotateView: function () {
        var me = this,
            view = me.getView(),
            rawDataGrid = view.down('#rawDataGrid');
        rawDataGrid.collapse();
    },

    onRawDataGridReady: function (grid) {
        var me = this,
            view = me.getView();
        view.setLoading(true);
        me.refreshStore(true, function () {
            grid.setSelection(grid.store.getAt(0));
            me.loadTextToAnnotate(0);
        });
    },

    loadDataFromFile: function () {
        var me = this;
        Ext.Ajax.request({
            url: Configs.Service + '/load_db',
            success: function () {
                Ext.Msg.alert('Load Status', 'Data loaded to database successfully.');
                me.refreshStore();
            },
            failure: function () {
                Ext.Msg.alert('Load Status', 'Failed to load data.');
            }
        });
    },

    loadTextToAnnotate: function (recPos, override) {
        if (typeof recPos != 'number') {
            recPos = 0;
        }
        var me = this,
            view = me.getView(),
            grid = view.down('grid'),
            selectedRec = grid.getSelection()[0],
            recPos = (selectedRec && override != true) ? grid.store.indexOf(selectedRec) : recPos,
            record = grid.store.getAt(recPos),
            conclusionText = record.get(Configs.AnnotationColumn),
            nonBiluoAnnotation = record.get('non_biluo_annotation'),
            annotateViewCntr = view.down('#annotateViewCntr'),
            data;
        annotateViewCntr.expand();
        annotateViewCntr.recPos = recPos;
        try {
            data = Ext.decode(nonBiluoAnnotation);
            view.down('annotatepanel').getController().setHtmlFromAnnotatedTxt(data);
        } catch (e) {
            annotateViewCntr.setLoading(true);
            Ext.Ajax.request({
                url: Configs.Service + '/get_entities',
                method: 'POST',
                params: {
                    text: conclusionText.replace(/\n/g, ' ')
                },
                success: function (response) {
                    annotateViewCntr.setLoading(false);
                    data = Ext.decode(response.responseText);
                    view.down('annotatepanel').getController().setHtmlFromAnnotatedTxt(data);
                },
                failure: function () {
                    annotateViewCntr.setLoading(false);
                }
            });
        }
    },

    loadConclusion: function (btn) {
        var me = this,
            view = me.getView(),
            annotateViewCntr = view.down('#annotateViewCntr'),
            grid = view.down('grid'),
            recPos = annotateViewCntr.recPos;
        if (btn.type === 1) {
            if (!grid.store.getAt(--recPos)) {
                recPos = grid.store.data.items.length - 1;
            }
        } else if (!grid.store.getAt(++recPos)) {
            recPos = 0;
        }
        me.loadTextToAnnotate(recPos, true);
    },

    saveAnnotation: function () {
        var me = this,
            view = me.getView(),
            recPos = view.down('#annotateViewCntr').recPos,
            rawDataGrid = view.down('#rawDataGrid'),
            unqId = rawDataGrid.store.getAt(recPos).get('unique_id'),
            annotatePanel = view.down('annotatepanel'),
            biluoFrmt = annotatePanel.getAnnotationInBiluoFormat(),
            nonBiluoFrmt = annotatePanel.getAnnotationInNonBiluoFormat();
        Ext.Ajax.request({
            url: Configs.Service + '/save_annotation',
            method: 'POST',
            params: {
                json: JSON.stringify({
                    uniqueId: unqId,
                    biluoFrmt: biluoFrmt,
                    nonBiluoFrmt: nonBiluoFrmt
                })
            },
            success: function () {
                Ext.Msg.alert('Save', 'Annotation Saved Successfully!');
                me.refreshStore();
            },
            failure: function () {
                Ext.Msg.alert('Save', 'Failed to save annotation!');
            }
        });
    },

    deleteAnnotation: function (menuItem) {
        var me = this,
            view = me.getView(),
            rawDataGrid = view.down('#rawDataGrid'),
            selectedRec = rawDataGrid.getSelection()[0];
        Ext.Ajax.request({
            url: Configs.Service + '/delete_annotation',
            method: 'POST',
            params: {
                json: JSON.stringify({
                    uniqueId: selectedRec.get('unique_id'),
                    type: menuItem.type
                })
            },
            success: function () {
                if (menuItem.type === 1) {
                    Ext.Msg.alert('Save', 'Record deleted Successfully!');
                } else {
                    Ext.Msg.alert('Save', 'Annotation deleted Successfully!');
                }
                me.refreshStore();
            },
            failure: function () {
                Ext.Msg.alert('Save', 'Failed to delete!');
            }
        });
    },

    refreshStore: function (reconfigure, callback) {
        var me = this,
            view = me.getView(),
            rawDataGrid = view.down('#rawDataGrid');
        Ext.Ajax.request({
            url: Configs.Service + '/get_conclusion_list',
            success: function (response) {
                view.setLoading(false);
                var data = Ext.decode(response.responseText),
                    len = Object.keys(data.index).length,
                    mapper = {},
                    gridData = [],
                    keys;
                for (var key in data) {
                    if (key == 'index') continue;
                    mapper[key] = Object.values(data[key]);
                }
                keys = Object.keys(mapper);
                for (var i = 0; i < len; i++) {
                    var obj = {};
                    for (var j = 0; j < keys.length; j++) {
                        obj[keys[j]] = mapper[keys[j]][i];    
                    }
                    gridData.push(obj);
                }
                rawDataGrid.store.loadRawData(gridData);
                if (reconfigure) {
                    rawDataGrid.reconfigure(rawDataGrid.store, keys.map(function (k) {
                        return {
                            text: k,
                            width: 400,
                            dataIndex: k,
                            hidden: ['unique_id', 'non_biluo_annotation'].includes(k)
                        }
                    }));
                }
                if (callback) callback();
            },
            failure: function () {
                view.setLoading(false);
            }
        });
    },

    createTrainingSet: function (menuItem) {
        Ext.Ajax.request({
            url: Configs.Service + '/create_training_data?type=' + menuItem.type,
            success: function () {
                var msgBox = Ext.Msg.alert('Create Training Set', 'Training set created successfully.</br>' + Configs.TrainingOutputPath.bold());
                msgBox.setWidth(500);
                msgBox.center();
            },
            failure: function () {
                Ext.Msg.alert('Create Training Set', 'Failed to create training set.');
            }
        });
    }
});