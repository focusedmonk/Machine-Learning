Ext.define('NLP.view.annotation.AnnotationPanel', function () {
	var originalValue;
	return {
		extend: 'Ext.panel.Panel',
		xtype: 'annotatepanel',
		layout: 'fit',
		scrollable: 'y',
		requires: [
			'NLP.view.annotation.AnnotationPanelCtrl'
		],
		controller: 'annotatectrl',

		initComponent: function () {
			var me = this;
			me.callParent(arguments);
		},
		
		getAnnotation: function () {
			var me = this;
			return me[me.biluoFormat ? 'getAnnotationInBiluoFormat' : 'getAnnotationInNonBiluoFormat']();
		},
			
		getAnnotationInBiluoFormat: function() {
			var annotatePanel = this,
				annotEl = annotatePanel.el.down('.annotate-tokens'),
				sentences = annotEl.dom.querySelectorAll('.annotation-sentence'),
				sentTokens = [],
				annotationJson = {
					paragraphs: [{
						raw: annotatePanel.annotationData.text,
						sentences: sentTokens
					}]
				};
			sentences.forEach(function (sent, i) {
				var childNodes = sent.childNodes,
					tokenNerArr = [],
					tokenId = 0;
				for (var i = 0; i < childNodes.length; i++) {
					if (childNodes[i].classList.contains('annotation-enabled')) {
						var tokens = childNodes[i].querySelectorAll('.token'),
							entity = childNodes[i].querySelector('.annotation-entity').textContent;
						for (var j = 0; j < tokens.length; j++) {
							mapperObj = {
								id: tokenId++,
								orth: String(tokens[j].textContent).trim(),
								ner: (function () {
									var ent;
									if (tokens.length === 1) {
										ent = 'U-' + entity;
									} else if (!j) {
										ent = 'B-' + entity;
									} else if (j == tokens.length - 1) {
										ent = 'L-' + entity;
									} else {
										ent = 'I-' + entity;
									}
									return ent;
								})()
							}
							tokenNerArr.push(mapperObj);
						}
					} else {
						mapperObj = {
							id: tokenId++,
							orth: String(childNodes[i].textContent).trim(),
							ner: 'O'
						}
						tokenNerArr.push(mapperObj);
					}
				}
				sentTokens.push({
					tokens: tokenNerArr
				});
			});
			return annotationJson;
		},

		getAnnotationInNonBiluoFormat: function () {
			var annotatePanel = this,
				annotEl = annotatePanel.el.down('.annotate-tokens'),
				sentences = annotEl.dom.querySelectorAll('.annotation-sentence'),
				sentStrtIndx = 0,
				rawConclusion = annotatePanel.annotationData.text,
				nonBiluoFormat = {
					text: rawConclusion,
					ents: [],
					sents: Ext.clone(annotatePanel.annotationData.sents)
				},
				sentLen;
			sentences.forEach(function (sent, i) {
				var childNodes = sent.childNodes,
					rawSentence = sent.getAttribute('sentence');
				sentLen = sentStrtIndx;
				sentStrtIndx += rawSentence.length;
				for (var i = 0; i < childNodes.length; i++) {
					if (childNodes[i].classList.contains('annotation-enabled')) {
						var tokens = childNodes[i].querySelectorAll('.token'),
							entity = childNodes[i].querySelector('.annotation-entity').textContent,
							annotatedTokens = '',
							entityStrtPos;
						for (var j = 0; j < tokens.length; j++) {
							annotatedTokens += tokens[j].textContent;
						}
						annotatedTokens = annotatedTokens.trim();
						entityStrtPos = rawConclusion.substring(sentLen).indexOf(annotatedTokens);
						if (entityStrtPos !== -1) {
							nonBiluoFormat.ents.push({
								start: sentLen + entityStrtPos,
								end: sentLen + entityStrtPos + annotatedTokens.length,
								label: entity
							});
							sentLen += entityStrtPos + annotatedTokens.length;
						}
					}
				}
			});
			return nonBiluoFormat;
		},
		
		resetOriginalValue: function () {
			originalValue = this.getAnnotation();
		},
	
		isDirty: function () {
			return JSON.stringify(originalValue) !== JSON.stringify(this.getAnnotation());
		},
		
		setHeightToContent: function () {
			var annotatePanel = this,
				scrollableParent = annotatePanel.up('[scrollable!=null]'),
				annotEl = annotatePanel.el.down('.annotate-tokens'),
				contentHeight = annotEl.dom.scrollHeight + 15;
			try {
				var scrollDim = scrollableParent.getScrollable().position;
				annotatePanel.setHeight(contentHeight);
				scrollableParent.scrollTo(scrollDim.x, scrollDim.y);
			} catch (e) {
				annotatePanel.setHeight(contentHeight);
			}
		}
	}
});