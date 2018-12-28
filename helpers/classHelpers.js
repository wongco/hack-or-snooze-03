function ajaxErrorOutput(jqXHR, textStatus, errorThrown) {
  console.log('jqXHR:');
  console.log(jqXHR);
  console.log('textStatus:');
  console.log(textStatus);
  console.log('errorThrown:');
  console.log(errorThrown);
}

const API_BASE_URL = 'https://hack-or-snooze-api.herokuapp.com';

export { API_BASE_URL, ajaxErrorOutput };
