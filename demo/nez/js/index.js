var height = $(window).height();
var width = $(window).width();

$(function(){
  $(document).mousemove(function(e){
    //console.log(e);
    c = [e.clientX/width, 0.3 + ((e.clientY/height)*0.6), 0.7];
    $('li#line').css('background-color', 'hsl(' + c[0]*255 + ',' + c[1]*100 + '%,' + c[2]*100 + '%)');
  });
  
});