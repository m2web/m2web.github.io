// Sticky HAL eye logic
// This script makes the HAL eye appear fixed at the top right when scrolled past

document.addEventListener('DOMContentLoaded', function() {
  var halEye = document.getElementById('hal-eye');
  var stickyEye = document.getElementById('hal-eye-sticky');
  // Clone the HAL eye's styles and structure
  stickyEye.className = 'hal-eye';
  stickyEye.style.position = 'fixed';
  stickyEye.style.top = '20px';
  stickyEye.style.right = '20px';
  stickyEye.style.zIndex = '9999';
  stickyEye.style.margin = '0';
  stickyEye.style.display = 'none';
  function checkSticky() {
    var rect = halEye.getBoundingClientRect();
    if (rect.bottom < 0) {
      stickyEye.style.display = 'block';
    } else {
      stickyEye.style.display = 'none';
    }
  }
  window.addEventListener('scroll', checkSticky);
  checkSticky();
});
