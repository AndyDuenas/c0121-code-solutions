const pg = require('pg');
const express = require('express');
const app = express();

const db = new pg.Pool({
  connectionString: 'postgres://dev:dev@localhost/studentGradeTable',
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/api/grades', (req, res) => {
  const sql = `
    select *
      from "grades"`;
  db
    .query(sql)
    .then(success => {
      res.status(200).json(success.rows);
    }).catch(error => {
      console.error(`error ${error}`);
      res.sendStatus(500);
    });
});

const parsedJSON = express.json();
app.use(parsedJSON);

const inRange = num => {
  if (parseInt(num) >= 0 && parseInt(num) <= 100) {
    return true;
  }
  return false;
};

app.post('/api/grades', (req, res) => {
  if (!req.body.name || !req.body.course || !req.body.score) {
    res.status(400).json({
      error: 'Missing one of the properties'
    });
    return;
  } else if (!inRange(req.body.score)) {
    res.status(400).json({
      error: 'score must be a positve number and between 0 and 100'
    });
    return;
  }
  const sql = `
    insert into "grades" ("name","course","score")
    values ($1,$2,$3)
    returning *`;

  const values = [req.body.name, req.body.course, req.body.score];

  db
    .query(sql, values)
    .then(success => {
      res.status(200).json(success.rows);
    }).catch(error => {
      console.error(`error ${error}`);
      res.sendStatus(500);
    });
});

app.put('/api/grades/:gradeId', (req, res) => {

  const gradeId = parseInt(req.params.gradeId, 10);

  if (!Number.isInteger(gradeId) || gradeId <= 0 || !req.body.name || !req.body.course || !req.body.score || !inRange(req.body.score)) {
    res.status(400).json({
      error: 'Make sure all requirements are fulfilled and gradeId is a positive number'
    });
    return;
  }

  const sql = `
    update "grades"
      set "name" = $1,
          "course" = $2,
          "score" = $3
    where "gradeId" = $4
    returning *
  `;

  const params = [req.body.name, req.body.course, req.body.score, gradeId];

  db
    .query(sql, params)
    .then(result => {

      const grade = result.rows[0];
      if (!grade) {

        res.status(404).json({
          error: `Cannot find grade with "gradeId" ${gradeId}`
        });
      } else {
        res.send(200).json(grade);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: 'An unexpected error occurred.'
      });
    });
});

app.delete('/api/grades/:gradeId', (req, res) => {

  const gradeId = parseInt(req.params.gradeId, 10);

  if (!Number.isInteger(gradeId) || gradeId <= 0) {
    res.status(400).json({
      error: 'Make sure all requirements are fulfilled and gradeId is a positive number'
    });
    return;
  }

  const sql = `
    delete from "grades"
    where "gradeId" = $1
    returning *
  `;

  const params = [gradeId];

  db
    .query(sql, params)
    .then(result => {
      const grade = result.rows[0];
      if (!grade) {
        res.status(404).json({
          error: `Cannot find grade with "gradeId" ${gradeId}`
        });
      } else {
        res.sendStatus(204);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: 'An unexpected error occurred.'
      });
    });
});

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Server is Listening');
});