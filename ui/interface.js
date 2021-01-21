$canvas.scroll(() => {
  cvs_repaint();
});

$(window).on('keypress', function (e) {
  let char = String.fromCharCode(e.which).toLowerCase();
  let ele = $('*[data-key="' + char + '"]');
  if (ele.is(":visible")) {
    ele.click();
    return false;
  }
});

$canvas.bind('mousewheel', function(e){
  if(e.originalEvent.wheelDelta > 0) {
    ui_zoom(0.3);
  } else{
    ui_zoom(-0.3);
  }
  return false;
});
window.addEventListener('resize', () => {
  cvs_repaint();
});

window.leftVel = 0;
window.topVel = 0;

window.addEventListener("mousemove", (e) => {
  leftVel = 0;
  topVel = 0;

  let b = $('.rightButtons')[0].getBoundingClientRect();

  if (e.clientX < b.x + b.width && e.clientY > b.y) return;

  if (e.clientX < 50) leftVel = -(50 - e.clientX);
  if (e.clientX > window.innerWidth - 50) leftVel = 50 - (window.innerWidth - e.clientX);
  if (e.clientY < 50) topVel = -(50 - e.clientY);
  if (e.clientY > window.innerHeight - 50) topVel = 50 - (window.innerHeight - e.clientY);
});

setInterval(() => {
  $canvas.scrollLeft($canvas.scrollLeft() + leftVel);
  $canvas.scrollTop($canvas.scrollTop() + topVel);
}, 20);
