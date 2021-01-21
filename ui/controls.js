let _ui_current_zoom = 1;
function ui_zoom(factor) {
  // let oldzoom = _ui_current_zoom;
  _ui_current_zoom = Math.max(0.5, _ui_current_zoom + factor / 5 * _ui_current_zoom);
  // let diff = _ui_current_zoom - oldzoom;
  $canvas_container.css('zoom', _ui_current_zoom);
  cvs_repaint();
  // $canvas.scrollTop($canvas.scrollTop() * oldzoom / _ui_current_zoom);
  // $canvas.scrollLeft($canvas.scrollLeft() * oldzoom / _ui_current_zoom);
}

function ui_start_sim(btn) {
  let err = sim_start();
  if (err) {
    $("#errorDialog")
      .text(err)
      .dialog({ modal: true, buttons: { Ok: function() { $(this).dialog( "close" ); } } });
  } else {
    btn.innerText = '=';
    $(btn).removeClass('active').attr('onclick', 'ui_stop_sim(this)');
  }
}
function ui_stop_sim(btn) {
  btn = btn ? btn : $('#playpause')[0];
  btn.innerText = '>';
  $(btn).addClass('active').attr('onclick', 'ui_start_sim(this)');
  sim_stop();
}
function ui_add_road(btn) {
  btn.previousElementSibling.style.display = "none";
  $(btn).addClass('active');
  ui_stop_sim(btn.previousElementSibling);
  ui_road_window(btn);
}
function ui_toggle_node(btn) {
  if ($(btn).hasClass('active')) {
    _skip_drawing_nodes = false;
    $(btn).removeClass('active');
    cvs_repaint();
  } else {
    _skip_drawing_nodes = true;
    $(btn).addClass('active');
    cvs_repaint();
  }
}
