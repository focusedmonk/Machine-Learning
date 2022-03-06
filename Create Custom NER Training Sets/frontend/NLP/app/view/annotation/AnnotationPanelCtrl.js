Ext.define('NLP.view.annotation.AnnotationPanelCtrl', function () {
    var txtSelection = false;
    return {
        extend: 'Ext.app.ViewController',
        alias: 'controller.annotatectrl',
		listen: {
			component: {
                'annotatepanel': {
                    boxready: 'onAnnotatePanelReady'
                }
            },
            controller: {
                '*': {
                    updateentitylabel: 'updateEntityLabel'
                }
            }
		},

        onAnnotatePanelReady: function () {
            var me = this,
                view = me.getView();
            if (view.annotationData) {
                me.setHtmlFromAnnotatedTxt(view.annotationData, view.resetOriginVal);
            }
			if (view.adjustToContentHeight) {
				// When the text is annotated (adding entities to corresponding text) or when the annotation is removed, adjust the height of the panel automatically if "adjustToContentHeight" is set to true.
				me.domObserver = new MutationObserver(function (mutationsList, observer) {
					for (var i = 0; i < mutationsList.length; i++) {
						if (mutationsList[i].target.classList.contains('annotation-sentence')) {
							view.setHeightToContent();
							break;
						}
					}
				});
				me.domObserver.observe(view.el.dom, {
					subtree: true,
					childList: true
				});
			}
        },
    
        enableAnnotation: function () {
            var me = this,
                view = me.getView(),
                annotateTokenDiv = view.el.down('.annotate-tokens');
            annotateTokenDiv.on('mousedown', function () {
                txtSelection = true;
            });
            annotateTokenDiv.on('mouseup', function () {
                if (!txtSelection) return;
                txtSelection = false;
                var txtToAnnotate = window.getSelection(),
                    txtRange = txtToAnnotate.getRangeAt(0);
                if ((txtRange.startOffset === txtRange.endOffset) && (txtRange.startContainer === txtRange.endContainer)) return;
                txtRange.setStartBefore(txtRange.startContainer);
                txtRange.setEndAfter(txtRange.endContainer);
                var enclosingSpan = document.createElement('span'),
                    nameEntitySpan = document.createElement('span'),
                    removeTag = document.createElement('span'),
                    crntNode = txtRange.startContainer;
                // If a selected text is already annotated, don't allow user to annotate again.
                while (crntNode !== txtRange.endContainer.nextElementSibling) {
                    if (crntNode.classList.contains('annotation-enabled') || 
                        crntNode.parentNode.classList.contains('annotation-enabled') ||
                        crntNode.classList.contains('annotation-entity')) {
                        txtToAnnotate.removeRange(txtRange);
                        return;
                    }
                    crntNode = crntNode.nextElementSibling;
                }
                // Enclose the selected tokens with annotation tag.
                enclosingSpan.setAttribute('class', 'annotation-enabled');
                crntNode = txtRange.startContainer;
                while (crntNode !== txtRange.endContainer) {
                    crntNode = crntNode.nextSibling;
                    enclosingSpan.appendChild(crntNode.previousSibling);
                }
                enclosingSpan.appendChild(txtRange.endContainer);
                Ext.get(enclosingSpan).el.on('mouseenter', me.annotatedTxtEnter.bind(me, removeTag));
                Ext.get(enclosingSpan).el.on('mouseleave', me.annotatedTxtLeave.bind(me, removeTag));
                // Assign a name-entity for an annotated text.
                nameEntitySpan.textContent = me.entityLabel;
                nameEntitySpan.setAttribute('class', 'annotation-entity');
                enclosingSpan.appendChild(nameEntitySpan);
                // Add a remove icon to remove annotation.
                removeTag.setAttribute('class', 'remove-annotation fa fa-times-circle');
                removeTag.setAttribute('title', 'Remove Annotation');
                enclosingSpan.appendChild(removeTag);
                Ext.get(removeTag).el.on('click', me.removeAnnotation.bind(me, removeTag));
                // Insert the annotated enclosing tag back to DOM and remove text selection.
                txtRange.insertNode(enclosingSpan);
                txtToAnnotate.removeRange(txtRange);
            });
        },
    
        annotatedTxtEnter: function (removeTag) {
            removeTag.style.display = 'inline';
        },
    
        annotatedTxtLeave: function (removeTag) {
            removeTag.style.display = 'none';
        },
    
        removeAnnotation: function (removeTag) {
            var annotationTag = removeTag.parentNode,
                annotationSentTag = Ext.get(annotationTag).el.up('.annotation-sentence'),
                elLeftToAnnotTag = annotationTag.nextElementSibling,
                annotationChildEl = annotationTag.querySelectorAll('.token');
            for (var i = 0; i < annotationChildEl.length; i++) {
                annotationSentTag.dom.insertBefore(annotationChildEl[i], elLeftToAnnotTag);
            }
            annotationSentTag.removeChild(annotationTag);
        },
    
        setHtmlFromAnnotatedTxt: function (data, resetOriginVal) {
            function addTokens (startPos, endPos) {
                var phrase = data.text.substring(startPos, endPos),
                    i;
                for (i = 0; i < Configs.SpecialChars.length; i++) {
                    var regEx = new RegExp('\\' + Configs.SpecialChars[i], 'g');
                    phrase = phrase.replace(regEx, [Configs.SplCharSeparator, Configs.SpecialChars[i], Configs.SplCharSeparator].join(''));
                }
                var phraseTokens = phrase.split(' ').removeEmptyValues();
                for (i = 0; i < phraseTokens.length; i++) {
                    if (phraseTokens[i].includes(Configs.SplCharSeparator)) {
                        var aftrSplit = phraseTokens[i].split(Configs.SplCharSeparator).removeEmptyValues();
                        for (var j = 0; j < aftrSplit.length; j++) {
                            tokenArr.push('<span class="token">' + aftrSplit[j] + ((j === aftrSplit.length - 1) ? ' ' : '') + '</span>');
                        }
                    } else {
                        tokenArr.push('<span class="token">' + phraseTokens[i] + ' </span>');
                    }
                }
            }
            var me = this,
                view = me.getView(),
                tokenArr = [],
                sentCntr = 0;
            view.annotationData = data;
            for (var i = 0; i < data.ents.length; i++) {
                var ent = data.ents[i],
                    nextEnt = data.ents[i + 1];
                // Begin a sentence.
                if (!data.ents[i - 1]) {
                    tokenArr.push('<p class="annotation-sentence" sentenceid="' + sentCntr + '" sentence="' + data.text.substring(data.sents[sentCntr].start, data.sents[sentCntr].end).trim() + '">');
                }
                if (i === 0 && ent.start !== 0) {
                    addTokens(0, ent.start);
                }
                tokenArr.push('<span class="annotation-enabled">');
                addTokens(ent.start, ent.end);
                tokenArr.push('<span class="annotation-entity">' + ent.label + '</span>');
                tokenArr.push('<span style="display:none;" class="remove-annotation fa fa-times-circle" title="Remove Annotation"></span>');
                tokenArr.push('</span>');
                if ((i === data.ents.length - 1) && (ent.end !== data.text.length)) {
                    addTokens(ent.end, data.text.length);
                }
                // Close the sentence.
                if (nextEnt) {
                    if (nextEnt.start >= data.sents[sentCntr].end) {
                        if (Math.abs((data.sents[sentCntr].end - ent.end) > 0)) {
                            addTokens(ent.end, data.sents[sentCntr].end);
                        }
                        tokenArr.push('</p>');
                        tokenArr.push('<div class="sentence-bifurcation"></div>');
                        sentCntr++;
                        tokenArr.push('<p class="annotation-sentence" sentenceid="' + sentCntr + '" sentence="' + data.text.substring(data.sents[sentCntr].start, data.sents[sentCntr].end).trim() + '">');
                        if (Math.abs(nextEnt.start - data.sents[sentCntr].start) > 0) {
                            addTokens(data.sents[sentCntr].start, nextEnt.start);
                        }
                    } else if (nextEnt.start > ent.end) {
                        addTokens(ent.end, nextEnt.start);
                    }
                } else {
                    tokenArr.push('</p>');
					if (data.sents[sentCntr + 1]) {
						tokenArr.push('<div class="sentence-bifurcation"></div>');
					}
                }
            }
            me.fireEvent('updateentitylabels');
            view.setHtml('<div class="annotate-tokens">' + tokenArr.join('') + '</div>');
            view.el.query('.remove-annotation').forEach(function (removeTag) {
                Ext.get(removeTag).el.on('click', me.removeAnnotation.bind(me, removeTag));
                Ext.get(removeTag.parentElement).el.on('mouseenter', me.annotatedTxtEnter.bind(me, removeTag));
                Ext.get(removeTag.parentElement).el.on('mouseleave', me.annotatedTxtLeave.bind(me, removeTag));
            });
            me.enableAnnotation();
			if (resetOriginVal) {
				view.resetOriginalValue();
			}
        },

        updateEntityLabel: function (entityLabel) {
            var me = this;
            me.entityLabel = entityLabel;
        }
    }
});