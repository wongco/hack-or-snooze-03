$(function() {
  const $submit = $('#submit');
  const $favorites = $('#favorites');
  const $newForm = $('#new-form');
  const $stories = $('#stories');
  const $clearFilter = $('.navbar-right');

  $submit.on('click', function() {
    $newForm.slideToggle();
  });

  $stories.on('click', 'small', function(e) {
    let currentHostname = $(e.target).text();
    $stories
      .children('li')
      .filter(function(i, el) {
        return (
          $(el)
            .children('small')
            .text() !== currentHostname
        );
      })
      .hide();

    $stories.addClass('hide-numbers');
    $clearFilter.show();
    $favorites.text('all');
  });
});
