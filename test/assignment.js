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
MathQuill.interfaceVersion(1);

var problems = Array();

var mathQuillOpts = {
    // for intuitive navigation of fractions
    leftRightIntoCmdGoes: 'up',
    autoCommands: 'pi theta sqrt sum',
    autoSubscriptNumerals: true,
};

// assumes the assignment-container div is empty, adds the html for giving
// the assignment a name
function newAssignment(assignmentName) {
    if (assignmentName == undefined || assignmentName == null || assignmentName == '') {
        assignmentName = 'Untitled Assignment';
    }
    var assignmentNameHTML = 
'Assignment Name <input type="text" id="assignment-name-text" name="assignment name" value="' + assignmentName + '"/>' + 
'<input type="submit" id="save-assignment" name="save assignment" value="save assignment"/> </br>';

    $('#assignment-container').append(assignmentNameHTML);
    $('#save-assignment').click(function() {
        saveAssignment();
    });
}

function collectAnswerKey() {
    // read current assignment content and use as answer key for now
    // will want a custom experience for teachers later
    return serializeAssignment();
}

/**
 * Requires the dom element of the text input for setting the score to be passed
 */
function setStudentGrade(textInput) {
    var score = textInput.value;
    var possiblePoints = $(textInput).closest('.problem-summary-container').find('.possible-points-input').last().val();
    if (isNaN(score) || score < 0) {
        alert('Please enter a numeric value for points');
        return;
    }
    // get the final answer entered for this problem, used to check against other student work
    console.log($(textInput).closest('.student-work').find('.solution-step').last());
    // TODO - possibly file a Mathquill github issue, why do I need [0] when I've called last()?
    var answer = MathQuill($(textInput).closest('.student-work').find('.solution-step').last()[0]).latex();
    $(textInput).closest('.problem-summary-container').find('.student-work').each(function(index, studentWork) {
        var currentAnswer = MathQuill($(studentWork).find('.solution-step').last()[0]).latex();
        if (currentAnswer == answer) {
            var work = $(studentWork);
            work.removeClass('answer-correct').removeClass('answer-incorrect').removeClass('answer-partially-correct');
            if (parseFloat(score) >= parseFloat(possiblePoints)) {
                work.addClass('answer-correct');
            } else if (score > 0) {
                work.addClass('answer-partially-correct');
            } else {
                work.addClass('answer-incorrect');
            }
            $(studentWork).find('.problem-grade-input').last().val(score).change();
        }
    });
}

function generateTeacherOverview(allStudentWork) {
    var confirmMessage = "Use current document as answer key and generate assignment overview?\n"
        "Warning -  save doc now to allow you to allow reuse of answer key later";
    if (!window.confirm(confirmMessage)) { 
        return; 
    }
    // TODO - allow teachers to set a different default value
    // with a popup at the start of the grading experience?
    // maybe the form for opening stuff to grade should be more
    // involved, with a number of configuration, filled in with
    // sensible defaults for basic users
    var defaultPointsPerProblem = 3;
    var answerKey = collectAnswerKey();
    var assignmentDiv = $('#assignment-container');
    assignmentDiv.empty(); 
    assignmentDiv.append('<input type="checkbox" id="apply-same-grade-to-others" checked="checked">' +
            'Apply manual grades to all students with matching answers ' +
            '<span title="Default to applying a score you give to one student to all others who got the' + 
            ' the same answer. You can override the score after looking at each individual student\'s work">' +
            ' - Hover for Info</span><br><br>');
    assignmentDiv.append(
    'Show Answers that are: &nbsp;' + 
    '<label>&nbsp;<input type="checkbox" id="show-incorrect" checked="checked">incorrect</label>' + 
    // this is unchecked programmatically to hide all of the correct work by default
    // there was a weird bug where parens weren't showing up with other attempts to hide
    // it programatically
    '<label>&nbsp;<input type="checkbox" id="show-partially-correct" checked="checked">partially correct</label>' + 
    '<label>&nbsp;<input type="checkbox" id="show-correct" checked="checked">correct</label><br>');
    // clear global list of problems
    problems = Array();

    var newProblemSummaryHtml = 
    '<div class="problem-summary-container" style="float:none;overflow: hidden">' + 
    '</div>';

    var correctAnswers = {};
    answerKey.problems.forEach(function(correctAnswer, index, array) {
        // TODO - handle multiple correct answers better
        correctAnswers[correctAnswer.problemNumber] = correctAnswer.steps;
    });
    aggregatedWorkForEachProblem = [];
    allStudentWork.forEach(function(assignInfo, index, array) {
        assignInfo.assignment.problems.forEach(function(problem, index, array) {
            var studentAnswer = problem.steps[problem.steps.length - 1];
            var autoGrade;
            if ($.inArray(studentAnswer, correctAnswers[problem.problemNumber]) > -1) {
                // answer was corrrect, for now skip
                // TODO - create hidden element that can be shown when correct work requested
                autoGrade = "correct";
            } else {
                autoGrade = "incorrect";
            }
             
            // once I am doing better grading basted on parsing the math, I won't be able
            // to use the answers as keys into this map
            // TODO - look up making custom map keys in JS (I know it ins't supported natively)
            // to make a hashmap or treemap I would need to define hashing that would consider
            // sufficiently similar expressions equivelent in hash value, while also customizing
            // what is allowed to be different between the expressions
            //    - might be easiest to just do a nested loop when that comes up
            var mapFromFinalAnswersToDifferentStudentWork = aggregatedWorkForEachProblem[problem.problemNumber]
            mapFromFinalAnswersToDifferentStudentWork = ( typeof mapFromFinalAnswersToDifferentStudentWork != 'undefined') ? 
                    mapFromFinalAnswersToDifferentStudentWork : {};
            workList = mapFromFinalAnswersToDifferentStudentWork[studentAnswer];

            workList = ( typeof workList != 'undefined' && workList instanceof Array ) ? workList : [];
            workList.push({studentFile : assignInfo.filename, autoGradeStatus: autoGrade, steps : problem.steps});
            aggregatedWorkForEachProblem[problem.problemNumber] = mapFromFinalAnswersToDifferentStudentWork;
        });
    });
    // TODO - look at result to pull out problems that don't have matching problem numbers (very few
    // problems end up in one of the lists) and give teachers the opportunity to rearrange them
    aggregatedWorkForEachProblem.forEach(function(problemSummary, index, array) {
        var newProblemDiv = $(newProblemSummaryHtml);
        $('#assignment-container').append(newProblemDiv);
        newProblemDiv.append('<p>Problem number ' + index + '&nbsp;&nbsp; ' + 
            '- Possible points &nbsp;<input type="text" class="possible-points-input" width="4" value="' + defaultPointsPerProblem + '"/></p>');
        //problemSummary.forEach(function(studentWorkLeadingToOneAnswer, studentFinalAnswer, array) {
        for ( var studentFinalAnswer in problemSummary) {
            // skip prototype properties
            if (problemSummary.hasOwnProperty(studentFinalAnswer)) continue;
            var allStudentsWorkLeadingToOneAnswer = problemSummary[studentFinalAnswer];
            var allStudentsWorkForCurrentAnswer = $('<div class="similar-student-answers"></div>');
            newProblemDiv.append(allStudentWorkForCurrentAnswer);
            allStudentsWorkLeadingToOneAnswer.forEach(function(studentWork, index, array) {
                var newProblemHtml = 
                // TODO - update this class of answer-correct vs answer-incorrect after teacher gives a manual grade
                // add a status for partial credit, color the div yellow in this case
                '<div class="student-work ' + 'answer-' + studentWork.autoGradeStatus + '" style="float:left"> <!-- container for nav an equation list -->' +
                    '<div style="float:left" class="equation-list"></div>' + 
                '</div>';
                var studentWorkDiv = $(newProblemHtml);
                allStudentsWorkForCurrentAnswer.append(studentWorkDiv);
                studentWork.steps.forEach(function(studentWorkStep, index, array) {
                    setTimeout(function() {
                        var newSpan = $('<span class="solution-step">' + studentWorkStep + '</span><br>');
                        studentWorkDiv.append(newSpan);
                        var steps = studentWorkDiv.find('.solution-step');
                        var mq = MathQuill.StaticMath(steps[steps.length - 1], mathQuillOpts);
                    }, 50);
                });
                var autoGradeScore
                if (studentWork.autoGradeStatus == "correct") {
                   autoGradeScore = defaultPointsPerProblem;
                } else {
                   autoGradeScore = 0;
                }
                var scoreInput = '<p>Score <input type="text" class="problem-grade-input" value="' + autoGradeScore + '"/>' + 
                    ' out of <span class="total-problem-points">' + defaultPointsPerProblem + '</span></p>';
                studentWorkDiv.append(scoreInput);
                studentWorkDiv.append('<p>Feedback</p><div><textarea width="30" height="8"></textarea></div>');
            });
        }
    });
    $('.possible-points-input').keyup(0 /* ignored */, function(evt) {
        if (evt.which == 13) {
            var possiblePoints = evt.target.value;
            if (isNaN(possiblePoints) || possiblePoints < 0) {
                alert('Please enter a positive numeric value for possible points');
                return;
            }
            $(evt.target).closest('.problem-summary-container').find('.total-problem-points').text(possiblePoints);

        } else {
            return false;
        }
    });
    $('.problem-grade-input').keydown(0 /* ignored */, function(evt) {
        if (evt.which == 13) {
            setStudentGrade(evt.target);
        }
    });
    $('.problem-grade-input').focusout(0 /* ignored */, function(evt) {
        setStudentGrade(evt.target);
    });
    $('.problem-grade-input').on('change input propertychange paste', function(evt) {
        /*
        var score = evt.target.value;
        // TODO - standardize how to handle trimming stuff like this before comparison
        var work = $(evt.target).closest('.student-work');
        console.log(score);
        console.log(possiblePoints);
        console.log(work);
        // TODO - decide on behavior for extra credit, should probably prompt users to make sure they meant to give it
        if (score >= possiblePoints) {
            work.addClass('answer-correct');
        } else if (score > 0) {
            work.addClass('answer-partially-correct');
        } else {
            work.addClass('answer-incorrect');
        }
        */
    });
    //apply-same-grade-to-others
    $('#show-correct').change(function() {
        if (! this.checked) {
            $('.answer-correct').fadeOut();
        } else {
            $('.answer-correct').show();
        }
    });
    $('#show-incorrect').change(function() {
        if (! this.checked) {
            $('.answer-incorrect').fadeOut();
        } else {
            $('.answer-incorrect').show();
        }
    });
    $('#show-partially-correct').change(function() {
        if (! this.checked) { 
            $('.answer-partially-correct').fadeOut();
        } else {
            $('.answer-partially-correct').show();
        }
    });
    setTimeout(function() {
        $('#show-correct').trigger('click');
        $('#show-partially-correct').trigger('click');
    }, 50);
}

function studentSubmissionsZip(evt) {

    var f = evt.target.files[0]; 

    if (f) {
        var r = new FileReader();
        r.onload = function(e) { 
            var content = e.target.result;

            var new_zip = new JSZip();
            // more files !
            new_zip.load(content);

            var allStudentWork = [];

            // you now have every files contained in the loaded zip
            for (file in new_zip.files) { 
                // don't get properties from prototype
                if (new_zip.files.hasOwnProperty(file)) {
                    // extra directory added when zipping files on mac
                    // TODO - check for other things to filter out from zip
                    // files created on other platforms
                    if (file.indexOf("__MACOSX") > -1 || file.indexOf(".DS_Store") > -1) continue;
                    // filter out directories which are part of this list
                    if (new_zip.file(file) == null) continue; 
                    var fileContents = new_zip.file(file).asText();
                    // how is this behaviring differrntly than JSOn.parse()?!?!
                    assignmentData = $.parseJSON(fileContents);
                    allStudentWork.push({filename : file, assignment : assignmentData});
                }
            }
            generateTeacherOverview(allStudentWork);
        }
        r.readAsArrayBuffer(f);
    } else { 
        alert("Failed to load file");
    }
}

// http://www.htmlgoodies.com/beyond/javascript/read-text-files-using-the-javascript-filereader.html
function readSingleFile(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0]; 

    if (f) {
        var r = new FileReader();
        r.onload = function(e) { 
            var contents = e.target.result;
            openAssignment(contents, f.name);  
        }
        r.readAsText(f);
    } else { 
        alert("Failed to load file");
    }
}

function openAssignment(serializedDoc, filename) {
    if (!window.confirm("Discard your current work and open the selected document?")) { 
        return; 
    }
    $('#assignment-container').empty();
    var assignment = JSON.parse(serializedDoc);
    problems = Array();
    newAssignment(filename.replace(/\.[^/.]+$/, ""));
    assignment.problems.forEach(function(problem, index, array) {
        newProblem(false);
        var newProblemWrapper = problems[problems.length - 1];
        newProblemWrapper.setProblemNumber(problem.problemNumber);
        problem.steps.forEach(function(step, stepIndex, stepArray) {
            setTimeout(function() {
                newProblemWrapper.addEquation(step);
            }, 50);
        });
    });
}

function serializeAssignment() {
    var outputProblems = [];
    problems.forEach(function(problem, index, array) {
        outputProblems.push( {
            problemNumber : problem.problemNumber(),
            steps : problem.latexForAllSteps()
        }); 
    });
    // return an object wrapping the problems list, to enable doc-wide settings
    // to be stored eventaully
    return { problems: outputProblems };
}

function saveAssignment() {
    var blob = new Blob([JSON.stringify(serializeAssignment())], {type: "text/plain;charset=utf-8"});
    saveAs(blob, $('#assignment-name-text').val() + '.math'); 
}

function createShortcutKeyHandler(problemWrapper) {
    return function(e) {
        // undo/redo, ctrl-z/ctrl-shift-z
        if ((e.which == 122 || e.which == 90) && e.ctrlKey) {
            if (e.shiftKey) {
                problemWrapper.redoStep();
            }
            else {
                problemWrapper.undoLastStep();
            }
        }

        // 101 is the keycode for he e key, 69 for capital e
        // I think some browsers send capital letters, so just
        // checking for that as well
        if ((e.which == 101 || e.which == 69) && e.ctrlKey) {
            problemWrapper.newStep();
        }
    }
}
