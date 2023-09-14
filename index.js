import mysql from "mysql2";
import inquirer from "inquirer";

let connection;
let selectedDatabase;


const connectDatabase = () => {
  const input = [
    {
      type: "input",
      name: "host",
      message: "Your Host Database IP ? :",
      default: "127.0.0.1",
    },
    {
      type: "input",
      name: "user",
      message: "Your Database Username ? :",
      default: "root",
    },
    {
      type: "input",
      name: "password",
      message: "Your Database password ? :",
      default: "adiwigunakevin",
    },
    {
      type: "input",
      name: "database",
      message: "Your Database name ? :",
      default: "sim_ide",
    },
    {
      type: "input",
      name: "port",
      message: "Your Database port ? :",
      default: 3306,
    },
  ];

  inquirer.prompt(input).then((answers) => {
    selectedDatabase = answers.database;
    connection = mysql.createConnection({
      host: answers.host,
      user: answers.user,
      password: answers.password,
      database: answers.database,
      port: answers.port,
    });

    connection.connect((err) => {
      if (err) {
        console.error("Error connecting to database:", err.message);
        connection.end();
      } else {
        console.log("Connected to database");
        askForSearchTerm();
      }
    });
  });
};

const askForSearchTerm = () => {
  const input = [
    {
      type: "input",
      name: "searchTerm",
      message: "Enter the search term :",
    },
    {
      type: "confirm",
      name: "repeat",
      message: "Do you want to search again?",
      default: false,
    },
  ];

  inquirer.prompt(input).then((answers) => {
    if (answers.searchTerm.trim() === "") {
      console.log("Search term cannot be empty. Please enter a search term.");
      askForSearchTerm();
    } else if (answers.repeat) {
      getData(answers.searchTerm, askForSearchTerm);
    } else {
      connection.end();
      console.log("Connection to database closed");
    }
  });
};

const getData = (data, callback) => {
  const query1 = `SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${selectedDatabase}';`;

  connection.query(query1, (err, result) => {
    if (err) {
      return;
    }

    const displayedTables = {};

    result.forEach((allTable) => {
      const query2 = `DESCRIBE ${allTable.table_name}`;

      connection.query(query2, (err, allColumn) => {
        allColumn.forEach((column) => {
          const columnName = column.Field;

          const query = `SELECT * FROM ${allTable.table_name} WHERE ${columnName} LIKE ?`;
          const searchTerm = `%${data}%`;

          connection.query(query, [searchTerm], (err, hasil) => {
            if (err) {
              console.error(err.message);
              return;
            }

            if (hasil.length > 0 && !displayedTables[allTable.table_name]) {
              console.log(`TABLE "${allTable.table_name}"` + " BERISI DATA ===>>> \n" + JSON.stringify(hasil, null, 2));
              displayedTables[allTable.table_name] = true;
            }
          });
        });
      });
    });

    callback();
  });
};

connectDatabase();
