const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');

const key = require('./privateSettings.json');

// TODO(you): Change the value of this string to the spreadsheet id for your
// GSA spreadsheet. See HW5 spec for more information.
const SPREADSHEET_ID = '1qQZjAdrUow4sQHAZY2giGEVq0_6vDv8iFnE_RjyHWnk';

const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

async function onGet(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;
  console.log(rows);
  
  const data = [];
  let data_row = {};
  
  for(let i=1; i < rows.length; i++ ){
	  data_row = {};
	  for(let j=0; j < rows[0].length; j++ ){
		  data_row[ rows[0][j] ] = rows[i][j];
	  }
	  data.push(data_row);
  }

  res.json(data);
}
app.get('/api', onGet);

async function onPost(req, res) {
  const messageBody = req.body;
  
  const result = await sheet.getRows();
  const rows = result.rows;
  
  let new_data = [];
  
  console.log("input: " + messageBody);
  for(let column_name in messageBody){
	  if(column_name.toLowerCase() === "name"){
		  //name = messageBody[column_name];
		  new_data.push(messageBody[column_name]);
	  }
	  else if(column_name.toLowerCase() === "email"){
		  //email = messageBody[column_name];
		  new_data.push(messageBody[column_name]);
	  }
  }
  
  if(new_data.length === 2){
	  await sheet.appendRow(new_data);
	  res.json( {response: 'success'} );
	  console.log("Post success.");
  }
  else{
	  res.json( {response: 'fail, name or email not found.'} );
	  console.log("Post failed.");
  }
}
app.post('/api', jsonParser, onPost);

async function onPatch(req, res) {
  let column  = req.params.column;
  column = column.toLowerCase();
  const value  = req.params.value;
  const messageBody = req.body;
  
  const result = await sheet.getRows();
  const rows = result.rows;
  
  let column_index = null;
  let row_index = null;
  let new_data = [];
  
  for(let i=0; i < rows[0].length ; i++){
	  if(column === rows[0][i].toLowerCase() ){
		  column_index = i;
		  break;
	  }
  }
  
  if(column_index != null){
	for(let i=1; i < rows.length ; i++){
		if(value === rows[i][column_index] ){
			row_index = i;
			break;
		}
	}
  }
  else{
	  res.json( {response: 'fail, column name not exist.'} );
	  console.log("Patch failed.");
  }
  
  if(row_index != null){
	  if(column === "name"){
		  new_data.push(rows[row_index][column_index]);
		  for(let column_name in messageBody){
			if(column_name.toLowerCase() === "email"){
				new_data.push(messageBody[column_name]);
				break;
			}
		  }
	  }
	  else if(column === "email"){
		  for(let column_name in messageBody){
			if(column_name.toLowerCase() === "name"){
				new_data.push(messageBody[column_name]);
				break;
			}
		  }
		  new_data.push(rows[row_index][column_index]);
	  }
	  
	  if(new_data.length === 2){
		  await sheet.setRow(row_index, new_data);
		  res.json( {response: 'success'} );
		  console.log("Patch success.");
	  }
	  else{
		  res.json( {response: 'fail, new data not found.'} );
		  console.log("Patch failed.");
	  }
  }
  else{
	  res.json( {response: 'fail, data not exist.'} );
	  console.log("Patch failed.");
  }
}
app.patch('/api/:column/:value', jsonParser, onPatch);

async function onDelete(req, res) {
  let column  = req.params.column;
  const value  = req.params.value;
  column = column.toLowerCase();
  
  const result = await sheet.getRows();
  const rows = result.rows;
  let column_index = null;
  let row_index = null;
  
  for(let i=0; i < rows[0].length ; i++){
	  if(column === rows[0][i].toLowerCase() ){
		  column_index = i;
		  break;
	  }
  }
  if(column_index === null){
	  res.json( {response: 'fail, column name not exist.'} );
	  console.log("Delete failed.");
  }
  else{
	  for(let i=1; i < rows.length; i++){
		  if(value === rows[i][column_index]){
			  row_index = i;
			  break;
		  }
	  }
	  if(row_index === null){
		  res.json( {response: 'fail, data not exist.'} );
		  console.log("Delete failed.");
	  }
	  else{
		  await sheet.deleteRow(row_index);
		  res.json( {response: 'success'} );
		  console.log("Delete success.");
	  }
  }
}
app.delete('/api/:column/:value',  onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`CS193X: Server listening on port ${port}!`);
});
