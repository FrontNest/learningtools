// Collapsible menu logic for decision trees
// Works on mobile and desktop

document.addEventListener('DOMContentLoaded', function () {
  // Select all menu headers (numbered sections)
  const menuHeaders = document.querySelectorAll('.menu-header');
  let openSection = null;

  menuHeaders.forEach(header => {
    header.addEventListener('click', function () {
      const sectionId = header.getAttribute('data-section-id');
      const section = document.getElementById(sectionId);
      if (!section) return;

      // Close previously open section
      if (openSection && openSection !== section) {
        openSection.classList.remove('open');
        openSection.style.maxHeight = null;
      }

      // Toggle current section
      if (section.classList.contains('open')) {
        section.classList.remove('open');
        section.style.maxHeight = null;
        openSection = null;
      } else {
        section.classList.add('open');
        section.style.maxHeight = section.scrollHeight + 'px';
        openSection = section;
        // Scroll to header
        header.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// CSS (add to your stylesheet):
// .decision-tree-section { overflow: hidden; transition: max-height 0.3s ease; max-height: 0; }
// .decision-tree-section.open { max-height: 2000px; }
// .menu-header { cursor: pointer; user-select: none; }
