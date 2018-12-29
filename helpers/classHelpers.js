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

/** helper function to hide all form containers */
function hideAllContainers() {
  $('.slide-container').slideUp();
}

/** helper function to hide all form container minus the target */
function selectiveHideContainers(idToLeaveShowing) {
  const containers = [
    'resetpassword-formgroup',
    'new-form',
    'createuser-form',
    'updateprofile-form'
  ];

  containers.forEach(containerId => {
    if (containerId !== idToLeaveShowing) {
      $(`#${containerId}`).slideUp();
    }
  });
}

export {
  ajaxErrorOutput,
  extractHostName,
  hideAllContainers,
  selectiveHideContainers
};
