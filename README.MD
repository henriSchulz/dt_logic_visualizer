# ITIV Digital Logic Visualizer

A comprehensive web-based educational tool for visualizing and analyzing digital logic functions, developed for the Institut für Technik der Informationsverarbeitung (ITIV) at Karlsruhe Institute of Technology (KIT).

## 🎯 Overview

This interactive logic visualizer helps students and educators understand Boolean logic through multiple synchronized representations:

- **Truth Tables** - Classical binary input/output representation
- **Symmetry Diagrams** (K-Maps) - Graphical optimization
- **Boolean Expressions** - DNF/CNF and minimized DMF/KMF forms
- **Boolean Development** - Step-by-step recursive expansion
- **Multiplexer Realization** - Hardware implementation visualization

## ✨ Features

### Multi-View Synchronization
All visualizations are synchronized - hover over any element to see corresponding parts highlighted across all views.

### Logic Gate Presets
- AND, OR, XOR gates
- NAND, NOR, XNOR gates
- Custom truth table editing

### Variable Support
- 2-4 Boolean variables (A, B, C, D)
- Dynamic scaling of all visualizations

### Interactive Elements
- Click truth table cells or symmetry diagram fields to toggle values
- Real-time minimization using Quine-McCluskey algorithm
- Customizable Boolean development order
- Responsive multiplexer tree visualization

### Educational Focus
- German language interface for KIT students
- Clear visual feedback and highlighting
- Don't care (-) state support
- Octal indexing in symmetry diagrams

## 🚀 Getting Started

### Prerequisites
- Modern web browser with ES6 module support
- No installation required - runs entirely client-side

### Usage
1. Open `index.html` in your web browser
2. Select a logic gate preset or create custom truth tables
3. Adjust number of variables (2-4)
4. Interact with any visualization to explore the logic function
5. Toggle views on/off using the checkboxes




## 🔧 Technical Details


### Browser Compatibility
- ES6 Modules
- SVG 1.1
- CSS Grid and Flexbox
- Modern JavaScript features

### Responsive Design
- Mobile-friendly interface
- Adaptive grid layouts
- Scalable vector graphics

## 🎓 Educational Context

Designed for the "Digitaltechnik" course at ITIV, this tool covers:

- Boolean algebra fundamentals
- Logic gate behavior and truth tables
- Karnaugh map optimization techniques
- Hardware implementation with multiplexers


## 🧪 Testing

Run the symmetry diagram tests:


## 🎨 Customization



### Styling
- Modify `assets/css/index.css` for general appearance
- Edit `assets/css/symmetry.css` for K-map specific styling
- Colors follow KIT brand guidelines

### Extending Variables
The system supports up to 4 variables by design. To extend:
1. Update `VARIABLE_NAMES` array in `src/index.js`
2. Modify symmetry mapping algorithms
3. Adjust UI layouts accordingly

## 🤝 Contributing

This is an educational tool for KIT ITIV. For improvements:

1. Ensure changes maintain educational clarity
2. Test with various logic functions
3. Verify German language accuracy
4. Maintain KIT branding consistency

## 📄 License

Educational tool for Karlsruhe Institute of Technology - Institut für Technik der Informationsverarbeitung.

## 🏛️ Institution

**Karlsruher Institut für Technologie (KIT)**  
Institut für Technik der Informationsverarbeitung (ITIV)  
Digitaltechnik

---

*Entwickelt für die Lehre in der Digitaltechnik am ITIV, KIT*