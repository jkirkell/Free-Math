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

function studentSubmissionsZip(evt) {

    var f = evt.target.files[0]; 

    if (f) {
        var r = new FileReader();
        r.onload = function(e) { 
            var content = e.target.result;

            var new_zip = new JSZip();
            // more files !
            new_zip.load(content);

            // you now have every files contained in the loaded zip
            for (file in new_zip.files) { 
                // don't get properties from prototype
                if (new_zip.files.hasOwnProperty(file)) {
                    // extra directory added when zipping files on mac
                    // TODO - check for other things to filter out from zip
                    // files created on other platforms
                    if (file.indexOf("__MACOSX") > -1) continue;
                    console.log(file);
                    if (new_zip.file(file) == null) continue; 
                    console.log(new_zip.file(file).asText()); // "Hello World\n"
                }
            }
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
    assignment.forEach(function(problem, index, array) {
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
    return outputProblems;
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
