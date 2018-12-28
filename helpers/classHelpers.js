// output to console during AJAX errors
function ajaxErrorOutput(jqXHR, textStatus, errorThrown) {
  console.log('jqXHR:');
  console.log(jqXHR);
  console.log('textStatus:');
  console.log(textStatus);
  console.log('errorThrown:');
  console.log(errorThrown);
}

// extracts hostname from url and return result
function extractHostName(url) {
  // turn url into jQuery anchor link obj
  const $newLink = $('<a>', {
    href: url
  });

  // extract hostname from jQuery anchor link obj
  const hostname = $newLink
    .prop('hostname')
    .split('.')
    .slice(-2)
    .join('.');

  return hostname;
}

function hideAllContainers() {
  $('.slide-container').slideUp();
}

export { ajaxErrorOutput, extractHostName, hideAllContainers };
