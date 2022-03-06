Ext.define('NLP.view.annotation.AnnotationView', {
    extend: 'Ext.panel.Panel',
    xtype: 'annotateview',
    controller: 'annotateviewctrl',
    style: 'background: white;',
    requires: [
        'NLP.view.annotation.AnnotationPanel',
        'NLP.view.annotation.AnnotationViewCtrl'
    ],
    layout: {
        type: 'hbox',
        align: 'stretch'
    },
    defaults: {
        collapseDirection: 'right',
        directChild: true,
        collapsible: true,
        collapsed: true,
        titleCollapse: true
    },
    annotationLabels: Configs.EntityLabels,

    initComponent: function () {
		var me = this;
        me.items = [me.createRawDataGrid(), {
            xtype: 'panel',
            itemId: 'annotateViewCntr',
            title: 'Annotation',
            collapsed: false,
            collapsible: false,
            flex: 1,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [{
                xtype: 'panel',
                cls: 'entity-label-panel',
                layout: 'fit',
                height: 80,
                scrollable: 'y',
                itemId: 'labelContainer'
            }, {
                xtype: 'annotatepanel',
                annotationData: me.annotationData,
                resetOriginVal: me.resetOriginVal,
                flex: 1,
                bodyCls: 'annotate-panel',
                html: '<div class="empty-text">Select conclusion from the list to annotate</div>'
            }],
            tbar: {
                enableOverflow: true,
                items: [{
                    xtype: 'button',
                    text: 'Save Annotation',
                    handler: 'saveAnnotation'
                }, '->', {
                    xtype: 'button',
                    text: '<< Previous',
                    type: 1,
                    handler: 'loadConclusion'
                }, {
                    xtype: 'button',
                    text: 'Next >>',
                    handler: 'loadConclusion'
                }]
            }
        }];
        me.callParent(arguments);
    },

    createRawDataGrid: function () {
        return {
            xtype: 'grid',
            flex: 1,
            itemId: 'rawDataGrid',
            title: 'Raw Data',
            scrollable: 'y',
            columnLines: true,
            viewConfig: {
                emptyText: '<div class="empty-text">Please upload the data.</div>'
            },
            store: Ext.create('Ext.data.Store', {
                data: [],
                fields: []
            }),
            columns: [],
            tbar: [{
                xtype: 'button',
                text: 'Load Data from Excel',
                handler: 'loadDataFromFile'
            }, {
                xtype: 'button',
                text: 'Delete',
                menu: [{
                    text: 'Delete Record',
                    type: 1,
                    handler: 'deleteAnnotation'
                }, {
                    text: 'Delete Annotations',
                    type: 2,
                    handler: 'deleteAnnotation'
                }]
            }, '->', {
                xtype: 'button',
                text: 'Annotate',
                handler: 'loadTextToAnnotate'
            }, {
                xtype: 'button',
                text: 'Create Training Set',
                menu: [{
                    text: "Spacy's BILUO Format",
                    type: 1,
                    handler: 'createTrainingSet'
                }, {
                    text: '(start_pos, end_pos, label) Format',
                    type: 2,
                    handler: 'createTrainingSet'
                }]
            }]
        }
    }
});