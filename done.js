var fs = require("fs");
var chroma = require("@v3rse/chroma");
var moment = require("moment");
//Path to task json file
var TASK_JSON_PATH = "./.database.json";

/*
Tasks to be done:
Add serial no relatd to each note book
Show notes from selected notebook
show all notes
filter and add tags without duplicity in tags array
search by tags array
*/

//Creates a file for keeping track of tasks
function init() {
  //create file if it's present.
  if (!fs.existsSync(TASK_JSON_PATH)) {
    console.log("Initialising storage.\n Creating `.database.json` file");
    setData({
      uncompleted: [],
      completed: [],
      notebook: [
        {
          name: "default",
          selected: true
        }
      ],
      tags: []
    });
  }
}

//Used to read some data from the JSON file
function getData() {
  //read file contents
  var contents = fs.readFileSync(TASK_JSON_PATH);

  //parse contents
  var data = JSON.parse(contents);

  return data;
}

//Used to write data to the JSON file
function setData(data) {
  // makes the object a JSON string
  var dataString = JSON.stringify(data);

  //write to  file
  fs.writeFileSync(TASK_JSON_PATH, dataString);
}

//Displays usage
function usage() {
  console.log(
    "Usage: done [add|check|delete|help|clear [all|done]|list [all|done]] [task]"
  );
  console.log(
    "`task` is only a string when using `add` and a number\nfor all other commands."
  );
  console.log("Using the `done` without arguments lists all tasks");
}

//Adds a task
function add(task) {
  //get data
  var data = getData();
  var noteTags = getTags();
  var nName;
  data.notebook.forEach(function(note, index) {
    if (note.selected === true) {
      nName = note.name;
    }
  });
  //add item to uncompleted
  data.uncompleted.push({
    task: task,
    dateCreated: Date.now(),
    tags: noteTags,
    notebookName: nName
    //notebookSrNum: def
  });

  //set data
  setData(data);

  //console.log("Length of array is ", data.uncompleted.length);
  var arrayNum = data.uncompleted.length - 1;
  saveTags(noteTags, arrayNum);

  sortTags();
  //list
  list();
}

//Moves task from uncompleted task list to completed task list
function check(task) {
  //get data
  var data = getData();

  if (data.uncompleted[task]) {
    //modify the data
    data.uncompleted[task].dateCompleted = Date.now();

    //move to completed tasks
    data.completed.push(data.uncompleted[task]);

    //remove from uncompleted
    data.uncompleted.splice(task, task + 1);

    //set data
    setData(data);
  } else {
    displayError("No such task");
  }

  //list
  list();
}

//Remove uncompleted task from the list.
function del(task) {
  //get data
  var data = getData();

  if (data.uncompleted[task]) {
    //delete item
    data.uncompleted.splice(task, task + 1);

    //set data
    setData(data);
  } else {
    displayError("No such task");
  }
  //list
  list();
}

//Clear all pending task from the list
function clear() {
  var data = getData();

  if (data.uncompleted) {
    data.uncompleted = [];
    setData(data);
    displayError("All pending tasks cleared");
  } else {
    displayError("No tasks present!!");
  }
}

//Clear all completed task from the list
function clearDone() {
  var data = getData();

  if (data.completed) {
    data.completed = [];
    setData(data);
    displayError("All completed tasks cleared");
  } else {
    displayError("No tasks present!!");
  }
}

//Clear all task from the list
function clearAll() {
  var data = getData();
  if (data.uncompleted || data.completed) {
    data.uncompleted = [];
    data.completed = [];
    data.tags = [];
    data.notebook = [];
    setData(data);
    displayError("All tasks cleared");
  } else {
    displayError("No tasks present!!");
  }
}

//Lists all pending tasks
function list() {
  var data = getData();

  if (data.uncompleted.length) {
    printUncompleted(data);
  } else {
    displayError("No tasks added!!");
  }
}

//Lists all completed tasks
function listCompleted() {
  var data = getData();

  if (data.completed.length) {
    printCompleted(data);
  } else {
    displayError("No tasks added!!");
  }
}

//Lists all tasks
function listAll() {
  //data
  var data = getData();

  if (data.uncompleted.length || data.completed.length) {
    printUncompleted(data);
    console.log("\n");
    printCompleted(data);
  } else {
    displayError("No tasks added!!");
  }
}

//Utils

//Formating for errors
function displayError(string) {
  console.log(chroma.bgred(chroma.black(string)));
}

//Prints pending tasks
function printUncompleted(data) {
  if (data.uncompleted.length) {
    //print the uncompleted list. using ANSI colors and formating
    console.log(chroma.underline.bgred("Pending:"));
    data.uncompleted.forEach(function(task, index) {
      console.log(
        "\t",
        chroma.lyellow(index + 1 + ". ["),
        chroma.lred("✖"),
        chroma.lyellow("] "),
        chroma.italics.lblue(
          " ( Added " + moment(task.dateCreated).fromNow() + " ) "
        ),
        task.task
      );
    });
  }
}

//Prints completed tasks
function printCompleted(data) {
  if (data.completed.length) {
    //print the uncompleted list. using ANSI colors and formating
    console.log(chroma.underline.bggreen("Completed:"));
    data.completed.forEach(function(task, index) {
      console.log(
        "\t",
        chroma.lyellow(index + 1 + ". ["),
        chroma.lgreen("✓"),
        chroma.lyellow("] "),
        chroma.italics.lblue(
          " ( " + moment(task.dateCompleted).fromNow() + " )"
        ),
        chroma.strikethrough(task.task)
      );
    });
  }
}

function getTags() {
  if (process.argv[4] === "--tags") {
    var tags = process.argv[5];

    if (tags) {
      var tag = tags.split(",");
      console.log(chroma.bggreen(chroma.black("TAGS ADDED")));
      tag.forEach(function(param) {
        console.log(chroma.bgyellow(chroma.black(param)));
      });
      return tag;
    }
  }
}

function saveTags(tag, num) {
  var data = getData();

  tag.forEach(function(param) {
    //console.log(param);
    var containTag = false;
    data.tags.forEach(function(alltags) {
      //console.log(alltags.name, "Hey! In all tags ", param)
      if (alltags.name.trim().toLowerCase() === param.trim().toLowerCase()) {
        //console.log("It contains it already.");
        containTag = true;
        alltags.arrayNum.push(num);
      }
    });

    if (!containTag) {
      data.tags.push({
        name: param.trim(),
        arrayNum: [num]
      });
      //console.log(param, " Added");
    }
  });
  //console.log("Inside save Tags  ", data);
  setData(data);
  //console.log(data.tags.length)
  //printTags();
}

function printTags() {
  var data = getData();
  console.log(data.tags);
  // data.tags.forEach(function(params) {
  //   console.log(params.name);
  // });
}

/*
function setData(data) {
  // makes the object a JSON string
  var dataString = JSON.stringify(data);

  //write to  file
  fs.writeFileSync(TASK_JSON_PATH, dataString);
}
*/

function addNoteBook(notebookName) {
  if (notebookName) {
    var data = getData();

    data.notebook.forEach(function(note) {
      note.selected = false;
    });

    data.notebook.push({
      name: notebookName,
      selected: true
    });

    setData(data);

    console.log("NoteBook: ", notebookName, " added");
  } else {
    console.log("Please provide a proper name.");
  }
}

function showNoteBooks() {
  var data = getData();
  if (data.notebook.length) {
    //print the uncompleted list. using ANSI colors and formating
    console.log(chroma.underline.bggreen("NoteBooks:"));
    data.notebook.forEach(function(task, index) {
      console.log(
        "\t",
        chroma.lyellow(index + 1 + ". "),
        chroma.strikethrough(task.name),
        task.selected ? chroma.lgreen("✓") : ""
      );
    });
  }
}

function selectNoteBook(num) {
  var data = getData();
  var cNum = parseInt(num, 10);
  if (cNum) {
    data.notebook.forEach(function(note, index) {
      if (index + 1 === cNum) {
        data.notebook.forEach(function(note) {
          note.selected = false;
        });
        note.selected = true;
        setData(data);
        console.log(
          chroma.lyellow("Notebook No: "),
          chroma.lyellow(num),
          " ",
          note.name,
          chroma.lgreen("selected")
        );
      }
    });
  } else {
    console.log(
      chroma.bgred("Error!!!"),
      "Please enter Serial No of the NoteBook. "
    );
  }
}

function showNoteBookNotes(num) {
  var data = getData();
  var cNum = parseInt(num, 10);

  if (cNum) {
    data.notebook.forEach(function(notebk, index) {
      if (index + 1 === cNum) {
        data.uncompleted.forEach(function(note, bkIndex) {
          //console.log("note is gere ", note.notebookName);
          if (note.notebookName === notebk.name) {
            console.log(
              "\t",
              chroma.lyellow(bkIndex + 1 + ". ["),
              chroma.lred("✖"),
              chroma.lyellow("] "),
              chroma.italics.lblue(
                " ( Added " + moment(note.dateCreated).fromNow() + " ) "
              ),
              chroma.strikethrough(note.task)
            );
          }
        });
      }
    });
  } else {
    console.log(
      chroma.bgred("Error!!!"),
      "Please enter Serial No of the NoteBook. "
    );
  }
}

function search(type) {
  if (type === "--tag") {
    var searchTag = process.argv[4];
    var data = getData();

    /* Include fuzzy search*/

    // var options = {
    //   shouldSort: true,
    //   includeScore: true,
    //   threshold: 0.6,
    //   location: 0,
    //   distance: 100,
    //   maxPatternLength: 32,
    //   minMatchCharLength: 1,
    //   keys: ["title", "author.firstName"]
    // };

    // var fuse = new Fuse(list, options); // "list" is the item array
    // var result = fuse.search("john");

    // data.uncompleted.forEach(function(note, index) {
    //   if (note.tags) {
    //     note.tags.forEach(function(token) {
    //       if (token.trim() === searchTag) {
    //         console.log(
    //           "\t",
    //           chroma.lyellow(index + 1 + ". ["),
    //           chroma.lred("✖"),
    //           chroma.lyellow("] "),
    //           chroma.italics.lblue(
    //             " ( Added " + moment(note.dateCreated).fromNow() + " ) "
    //           ),
    //           note.task
    //         );
    //       }
    //     });
    //   }
    // });

    data.tags.forEach(function(tag) {
      if (tag.name === searchTag) {
        tag.arrayNum.forEach(function(task) {
          //console.log(data.uncompleted[task]);
          var searchTask = data.uncompleted[task];
          if (searchTask) {
            console.log(
              "\t",
              chroma.lyellow(task + 1 + ". ["),
              chroma.lred("✖"),
              chroma.lyellow("] "),
              chroma.italics.lblue(
                " ( Added " + moment(searchTask.dateCreated).fromNow() + " ) "
              ),
              searchTask.task
            );
          }
        });
      }
    });

    data.completed.forEach(function(note, index) {
      if (note.tags) {
        note.tags.forEach(function(token) {
          if (token.trim() === searchTag) {
            console.log(
              "\t",
              chroma.lyellow(index + 1 + ". ["),
              chroma.lgreen("✓"),
              chroma.lyellow("] "),
              chroma.italics.lblue(
                " ( Added " + moment(note.dateCreated).fromNow() + " ) "
              ),
              note.task
            );
          }
        });
      }
    });
  } else {
    //var search = process.argv[4];
    var searchData = getData();

    searchData.uncompleted.forEach(function(line, index) {
      var searchTerms = line.task.split(" ");

      //console.log(line.task);
      searchTerms.forEach(function(term) {
        if (term.toLowerCase() === type.toLowerCase()) {
          console.log(line.task);
        }
      });
    });
  }
}

function sortTags() {
  var data = getData();

  data.tags.sort(function(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1;
    }
    if (a.name.toLowerCase() > b.name.toLowerCase()) {
      return 1;
    }
    return 0;
  });

  setData(data);
  //console.log(data.tags);
}

function multiline() {
  var readline = require("readline");

  var input = [];

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.prompt();

  rl.on("line", function(cmd) {
    input.push(cmd);
  });

  rl.on("close", function(cmd) {
    console.log(input.join("\n"));
    process.exit(0);
  });
}

//Entry point
var command = process.argv[2];
var argument = process.argv[3];

init();

switch (command) {
  case "add":
    add(argument);
    break;
  case "check":
    check(argument - 1);
    break;
  case "delete":
    del(argument - 1);
    break;
  case "help":
    usage();
    break;
  case "clear":
    if (argument == "all") {
      clearAll();
    } else if (argument == "done") {
      clearDone();
    } else {
      clear();
    }
    break;
  case "list":
    if (argument == "all") {
      listAll();
    } else if (argument == "done") {
      listCompleted();
    } else {
      list();
    }
    break;

  case "add-nbk":
    addNoteBook(argument);
    break;
  case "show-nbk":
    showNoteBooks();
    break;
  case "select-nbk":
    selectNoteBook(argument);
    break;
  case "show-nbk-notes":
    showNoteBookNotes(argument);
    break;
  case "all-tags":
    printTags();
    break;
  case "search":
    search(argument);
    //sortTags();
    break;
  case "test":
    multiline();
    break;
  case undefined:
    list();
    break;
  default:
    displayError("Command not found!!");
    usage();
    break;
}
