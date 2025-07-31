// Main JavaScript file for CoolTestWebsite

// Function to change the greeting text when clicked
function changeGreeting() {
    const greetings = [
        "Hello!",
        "Hi there!",
        "Welcome!",
        "Greetings!",
        "Hey!",
        "Howdy!"
    ];
    
    const heading = document.querySelector('h1');
    const currentText = heading.textContent;
    let newText;
    
    // Choose a different greeting than the current one
    do {
        newText = greetings[Math.floor(Math.random() * greetings.length)];
    } while (newText === currentText);
    
    heading.textContent = newText;
}

// Function to add a current date display
function showCurrentDate() {
    const dateElement = document.createElement('p');
    dateElement.id = 'current-date';
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const today = new Date();
    dateElement.textContent = "Today is " + today.toLocaleDateString('en-US', options);
    dateElement.style.marginTop = '10px';
    dateElement.style.color = '#666';
    
    document.body.appendChild(dateElement);
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add click event to the heading
    const heading = document.querySelector('h1');
    heading.style.cursor = 'pointer';
    heading.title = 'Click me to change the greeting!';
    heading.addEventListener('click', changeGreeting);
    
    // Show the current date
    showCurrentDate();
});