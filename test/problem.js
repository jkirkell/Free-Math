/*
    This file is part of OpenNotebook-Web

    OpenNotebook-Web is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    OpenNotebook-Web is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with OpenNotebook-Web.  If not, see <http://www.gnu.org/licenses/>. 
*/

function newProblem(insertEmptyStep) {
    // prevent students from moving on unless the last problem has a number
    var lastProblem = $('#assignment-container').find('.problem-container').last();
    if(lastProblem[0] && lastProblem.find('.problem-number').last().val().trim() === '') {
        alert('Last problem must have a number before adding a new one');
        return;
    }
    var newProblemDiv = $(newProblemHtml);
    $('#assignment-container').append(newProblemDiv);
    // object to hold background state as well as DOM references for the
    // new problem
    var newProblemWrapper = (function() {
        // stack with the redo steps in it, use push/pop to modify
        var savedRedoSteps = [];
        var problemWrapperDiv = newProblemDiv;
        
        return { 
            focusLastStep : function() {
                all_spans = problemWrapperDiv.find('.solution-step');
                MathQuill(all_spans[all_spans.length - 1]).focus();
            },
            setProblemNumber : function(problemNumber) {
                var problemNumberText = problemWrapperDiv.find('.problem-number');
                return problemNumberText.val(problemNumber);
            },
            // TODO - more efficient, just set this once in the object whenever the text field is modified
            problemNumber : function() {
                var problemNumberText = problemWrapperDiv.find('.problem-number');
                return problemNumberText.val();
            },
            latexForAllSteps : function() {
                var allSteps = [];
                var all_spans = problemWrapperDiv.find('.solution-step');
                // is this actually an object with just numerical keys?
                // it is, jQuery wraps the array to expose the find(), trigger(),
                // each(), etc. methods
                //if (! (typeof all_spans == 'Array') ) return allSteps;
                all_spans.each(function(index, mathStepSpan) {
                    allSteps.push(MathQuill(mathStepSpan).latex());
                });
                return allSteps;
            },

            mathquillLast : function() { 
                var all_spans = problemWrapperDiv.find('.solution-step');
                var mq = MathQuill.MathField(all_spans[all_spans.length - 1],mathQuillOpts);
                mq.reflow();
            },

            lastSpan : function() {
                var all_spans = problemWrapperDiv.find('.solution-step');
                return all_spans[all_spans.length - 1]
            },

            newStep : function() {
                savedRedoSteps = [];
                var newLatex = MathQuill(this.lastSpan()).latex();
                var newSpan = $('<span class="solution-step">' + newLatex + '</span><br>');
                problemWrapperDiv.find('.equation-list').append(newSpan);
                this.mathquillLast();
                this.focusLastStep();
            },

            addEquation : function(newLatex) {
                var newSpan = $('<span class="solution-step">' + newLatex + '</span><br>');
                problemWrapperDiv.find('.equation-list').append(newSpan);
                this.mathquillLast();
                this.focusLastStep();
            },

            redoStep : function() {
                if (savedRedoSteps.length == 0) {
                    // hitting the button make the text field lose focus
                    this.focusLastStep();
                    return;
                }
                this.addEquation(savedRedoSteps.pop());
            },

            undoLastStep :  function () {
                var all_spans = problemWrapperDiv.find('.solution-step');
                // do not leave users without a box to type in
                if (all_spans.length == 1) return;
                var lastSpanEl = this.lastSpan();
                savedRedoSteps.push(MathQuill(lastSpanEl).latex());
                problemWrapperDiv.find('.equation-list').get(0).removeChild(lastSpanEl);
                // remove the <br> tag
                problemWrapperDiv.find('.equation-list br').last().remove();
                this.focusLastStep();
            }
        }
    }());
    problems.push(newProblemWrapper);
    if (insertEmptyStep) {
        setTimeout(function() {
            newProblemWrapper.addEquation('');
            newProblemWrapper.focusLastStep();
        }, 50);
    }
    $(newProblemDiv).keydown(0 /* ignored */, createShortcutKeyHandler(newProblemWrapper));
    newProblemDiv.find('.next-step').click(function() {
        newProblemWrapper.newStep();
    });
    newProblemDiv.find('.undo-step').click(function() {
        newProblemWrapper.undoLastStep();
    });
    newProblemDiv.find('.redo-step').click(function() {
        newProblemWrapper.redoStep();
    });
}
