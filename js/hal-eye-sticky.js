// Sticky HAL eye logic
// This script makes the HAL eye appear fixed at the top right when scrolled past

document.addEventListener('DOMContentLoaded', function() {
  var halEye = document.getElementById('hal-eye');
  var stickyEye = document.getElementById('hal-eye-sticky');
  // Check if both elements exist before proceeding
  if (!halEye || !stickyEye) {
    // Optionally, you could log a warning here
    return;
  }
  // Clone the HAL eye's styles and structure
  stickyEye.className = 'hal-eye';
  stickyEye.style.position = 'fixed';
  stickyEye.style.top = '10px';
  stickyEye.style.right = '10px';
  stickyEye.style.left = '';
  stickyEye.style.zIndex = '9999';
  stickyEye.style.margin = '0';
  stickyEye.style.display = 'none';

  // Responsive adjustment for mobile
  function adjustStickyPosition() {
    if (window.innerWidth <= 600) {
      stickyEye.style.left = '50%';
      stickyEye.style.right = '';
      stickyEye.style.transform = 'translateX(-50%)';
    } else {
      stickyEye.style.left = '';
      stickyEye.style.right = '10px';
      stickyEye.style.transform = '';
    }
  }

  function checkSticky() {
    var rect = halEye.getBoundingClientRect();
    if (rect.bottom < 0) {
      stickyEye.style.display = 'block';
      adjustStickyPosition();
    } else {
      stickyEye.style.display = 'none';
    }
  }
  window.addEventListener('scroll', checkSticky);
  window.addEventListener('resize', adjustStickyPosition);
  checkSticky();
});
