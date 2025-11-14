function selectPage(page) {
  const content = document.getElementById('content');
  switch (page) {
    case 'home':
      content.innerHTML = 'Welcome to the Home page!';
      break;
    case 'about':
      content.innerHTML = 'Learn more About us.';
      break;
    case 'services':
      content.innerHTML = 'These are our Services.';
      break;
    case 'contact':
      content.innerHTML = 'Get in touch through our Contact page.';
      break;
    default:
      content.innerHTML = 'Select a page from the menu.';
  }
}
