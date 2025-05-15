document.addEventListener('DOMContentLoaded', function() {
    function createVectorLabel(svg, x, y, color, label) {
    svg.append("foreignObject")
        .attr("x", x - 25)
        .attr("y", y - 25)
        .attr("width", 50)
        .attr("height", 30)
        .append("xhtml:div")
        .style("color", color)
        .style("text-align", "center")
        .style("font-size", "16px")
        .html(`\\( ${label} \\)`);
    if (window.MathJax && MathJax.typeset) MathJax.typeset();
    }

    // Set up the vector plot with -12 to 12 domain
    const width = 400;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select("#vector-plot")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add arrowhead marker
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#999");

    // Set up scales with -12 to 12 domain
    const xScale = d3.scaleLinear()
        .domain([-12, 12])
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([-12, 12])
        .range([innerHeight, 0]);

    // Add grid lines
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickFormat("")
            .ticks(24));

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickFormat("")
            .ticks(24));

    // Add axes
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale));

    // Draw x and y axes
    svg.append("line")
        .attr("x1", xScale(0))
        .attr("y1", yScale(12))
        .attr("x2", xScale(0))
        .attr("y2", yScale(-12))
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

    svg.append("line")
        .attr("x1", xScale(-12))
        .attr("y1", yScale(0))
        .attr("x2", xScale(12))
        .attr("y2", yScale(0))
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

    // Initial vectors
    let a = { x: 2, y: 1 };
    let b = { x: 1, y: 2 };
    let c1 = 1;
    let c2 = 1;

    // Draw initial vectors
    drawVectors();

    // Event listeners
    document.getElementById("animate-btn").addEventListener("click", animateCombination);
    document.getElementById("step-btn").addEventListener("click", stepByStepAnimation);
    document.getElementById("reset-btn").addEventListener("click", resetVectors);
    document.getElementById("check-p1").addEventListener("click", checkProblem1);
    document.getElementById("hint-p1").addEventListener("click", toggleHint);
    document.getElementById("solve-p1").addEventListener("click", toggleSolution);
    document.getElementById("hint-p2").addEventListener("click", toggleExplanation);
    
    document.querySelectorAll(".mcq-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            checkProblem2(this);
        });
    });

    // Input change listeners
    document.getElementById("v1x").addEventListener("input", updateVectors);
    document.getElementById("v1y").addEventListener("input", updateVectors);
    document.getElementById("v2x").addEventListener("input", updateVectors);
    document.getElementById("v2y").addEventListener("input", updateVectors);
    document.getElementById("c1").addEventListener("input", updateCombination);
    document.getElementById("c2").addEventListener("input", updateCombination);
    document.getElementById("c1-range").addEventListener("input", syncRangeWithNumber);
    document.getElementById("c2-range").addEventListener("input", syncRangeWithNumber);

    function drawVectors() {
    svg.selectAll(".vector-path").remove();
    svg.selectAll(".vector-label").remove();
    svg.selectAll(".vector-tip").remove();
    svg.selectAll("foreignObject").remove();

    // Vector a
    const aLine = svg.append("line")
        .attr("id", "a-path")
        .attr("class", "vector-path")
        .attr("x1", xScale(0))
        .attr("y1", yScale(0))
        .attr("x2", xScale(a.x))
        .attr("y2", yScale(a.y))
        .attr("stroke", "#E41A1C")
        .attr("marker-end", "url(#arrowhead)");

    aLine.on("mouseover", function() {
            showTooltip(`Vector \\( \\vec{a} \\)<br>(${a.x}, ${a.y})<br>Magnitude: ${calculateMagnitude(a).toFixed(2)}<br>Angle: ${calculateAngle(a).toFixed(2)}°`);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

    createVectorLabel(svg, xScale(a.x / 2), yScale(a.y / 2), "#E41A1C", "\\vec{a}");

    // Vector b
    const bLine = svg.append("line")
        .attr("id", "b-path")
        .attr("class", "vector-path")
        .attr("x1", xScale(0))
        .attr("y1", yScale(0))
        .attr("x2", xScale(b.x))
        .attr("y2", yScale(b.y))
        .attr("stroke", "#377EB8")
        .attr("marker-end", "url(#arrowhead)");

    bLine.on("mouseover", function() {
            showTooltip(`Vector \\( \\vec{b} \\)<br>(${b.x}, ${b.y})<br>Magnitude: ${calculateMagnitude(b).toFixed(2)}<br>Angle: ${calculateAngle(b).toFixed(2)}°`);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

    createVectorLabel(svg, xScale(b.x / 2), yScale(b.y / 2), "#377EB8", "\\vec{b}");

    // Resultant vector v
    const resultX = c1 * a.x + c2 * b.x;
    const resultY = c1 * a.y + c2 * b.y;
    const resultVector = { x: resultX, y: resultY };

    const resultLine = svg.append("line")
        .attr("id", "result-path")
        .attr("class", "vector-path")
        .attr("x1", xScale(0))
        .attr("y1", yScale(0))
        .attr("x2", xScale(resultX))
        .attr("y2", yScale(resultY))
        .attr("stroke", "#4DAF4A")
        .attr("stroke-width", 3)
        .attr("marker-end", "url(#arrowhead)");

    resultLine.on("mouseover", function() {
            showTooltip(`Resultant Vector \\( \vec{v} \\)<br>(${resultX.toFixed(2)}, ${resultY.toFixed(2)})<br>Magnitude: ${calculateMagnitude(resultVector).toFixed(2)}<br>Angle: ${calculateAngle(resultVector).toFixed(2)}°`);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

    createVectorLabel(svg, xScale(resultX / 2), yScale(resultY / 2), "#4DAF4A", "\\vec{v}");

    updateResultDisplay(resultX, resultY);
    }

    function animateCombination() {
    a = {
        x: parseFloat(document.getElementById("v1x").value),
        y: parseFloat(document.getElementById("v1y").value)
    };
    b = {
        x: parseFloat(document.getElementById("v2x").value),
        y: parseFloat(document.getElementById("v2y").value)
    };
    c1 = parseFloat(document.getElementById("c1").value);
    c2 = parseFloat(document.getElementById("c2").value);

    svg.selectAll(".vector-path").remove();
    svg.selectAll(".vector-label").remove();
    svg.selectAll(".animated-vector").remove();
    svg.selectAll("foreignObject").remove();

    const aLine = svg.append("line")
        .attr("id", "a-path")
        .attr("class", "vector-path")
        .attr("x1", xScale(0))
        .attr("y1", yScale(0))
        .attr("x2", xScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", "#E41A1C")
        .attr("marker-end", "url(#arrowhead)");

    aLine.transition()
        .duration(1000)
        .attr("x2", xScale(a.x))
        .attr("y2", yScale(a.y));

    createVectorLabel(svg, xScale(a.x / 2), yScale(a.y / 2), "#E41A1C", "\\vec{a}");

    const bLine = svg.append("line")
        .attr("id", "b-path")
        .attr("class", "vector-path")
        .attr("x1", xScale(0))
        .attr("y1", yScale(0))
        .attr("x2", xScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", "#377EB8")
        .attr("marker-end", "url(#arrowhead)");

    bLine.transition()
        .delay(1000)
        .duration(1000)
        .attr("x2", xScale(b.x))
        .attr("y2", yScale(b.y));

    createVectorLabel(svg, xScale(b.x / 2), yScale(b.y / 2), "#377EB8", "\\vec{b}");

    const scaledA = svg.append("line")
        .attr("class", "vector-path animated-vector")
        .attr("x1", xScale(0))
        .attr("y1", yScale(0))
        .attr("x2", xScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", "#E41A1C")
        .attr("stroke-dasharray", "5,5")
        .attr("marker-end", "url(#arrowhead)");

    scaledA.transition()
        .delay(2000)
        .duration(1000)
        .attr("x2", xScale(c1 * a.x))
        .attr("y2", yScale(c1 * a.y));

    const scaledB = svg.append("line")
        .attr("class", "vector-path animated-vector")
        .attr("x1", xScale(c1 * a.x))
        .attr("y1", yScale(c1 * a.y))
        .attr("x2", xScale(c1 * a.x))
        .attr("y2", yScale(c1 * a.y))
        .attr("stroke", "#377EB8")
        .attr("stroke-dasharray", "5,5")
        .attr("marker-end", "url(#arrowhead)");

    scaledB.transition()
        .delay(3000)
        .duration(1000)
        .attr("x2", xScale(c1 * a.x + c2 * b.x))
        .attr("y2", yScale(c1 * a.y + c2 * b.y));

    const resultX = c1 * a.x + c2 * b.x;
    const resultY = c1 * a.y + c2 * b.y;

    const resultLine = svg.append("line")
        .attr("id", "result-path")
        .attr("class", "vector-path")
        .attr("x1", xScale(0))
        .attr("y1", yScale(0))
        .attr("x2", xScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", "#4DAF4A")
        .attr("stroke-width", 3)
        .attr("marker-end", "url(#arrowhead)");

    resultLine.transition()
        .delay(4000)
        .duration(1000)
        .attr("x2", xScale(resultX))
        .attr("y2", yScale(resultY));

    createVectorLabel(svg, xScale(resultX / 2), yScale(resultY / 2), "#4DAF4A", "\\vec{v}");

    setTimeout(() => {
        updateResultDisplay(resultX, resultY);
    }, 5000);
    }

    function stepByStepAnimation() {
    // Helper function to render MathJax
    function renderMathJax() {
        if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise && MathJax.typesetPromise();
        }
    }

    // Get input values
    const a = {
        x: parseFloat(document.getElementById("v1x").value),
        y: parseFloat(document.getElementById("v1y").value)
    };
    const b = {
        x: parseFloat(document.getElementById("v2x").value),
        y: parseFloat(document.getElementById("v2y").value)
    };
    const c1 = parseFloat(document.getElementById("c1").value);
    const c2 = parseFloat(document.getElementById("c2").value);

    // Animation timing
    const stepDuration = 1200;
    const pauseDuration = 1200;

    // Create or clear explanation box
    let explanationBox = document.getElementById("step-explanation");
    if (!explanationBox) {
        explanationBox = document.createElement("div");
        explanationBox.id = "step-explanation";
        explanationBox.className = "explanation-box";
        document.querySelector(".combination-result").appendChild(explanationBox);
    }
    explanationBox.innerHTML = "<h3>Step-by-Step Explanation</h3>";
    renderMathJax();

    // Clear previous elements
    svg.selectAll(".vector-path").remove();
    svg.selectAll(".vector-label").remove();
    svg.selectAll(".animated-vector").remove();
    svg.selectAll(".step-text").remove();
    svg.selectAll("foreignObject").remove();

    const clearStepText = () => {
        svg.selectAll(".step-text").remove();
        svg.selectAll("foreignObject").remove();
    };

    // Step 1: Draw vector a
    explanationBox.innerHTML += "<p><strong>Step 1:</strong> Draw vector \\( \\vec{a} \\) (red)</p>";
    renderMathJax();
    
    const aLine = svg.append("line")
        .attr("id", "a-path")
        .attr("class", "vector-path")
        .attr("x1", xScale(0))
        .attr("y1", yScale(0))
        .attr("x2", xScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", "#E41A1C")
        .attr("marker-end", "url(#arrowhead)");

    clearStepText();
    const fo1 = svg.append("foreignObject")
        .attr("x", xScale(a.x/2) - 50)
        .attr("y", yScale(a.y/2) - 30)
        .attr("width", 100)
        .attr("height", 20)
        .append("xhtml:div")
        .style("text-align", "center")
        .style("font-size", "12px")
        .html(`Vector \\( \\vec{a} = (${a.x}, ${a.y}) \\)`);
    renderMathJax();

    aLine.transition().duration(stepDuration).attr("x2", xScale(a.x)).attr("y2", yScale(a.y));
    createVectorLabel(svg, xScale(a.x / 2), yScale(a.y / 2), "#E41A1C", "\\vec{a}");

    // Step 2: Scale vector a by c1
    setTimeout(() => {
        explanationBox.innerHTML += `<p><strong>Step 2:</strong> Scale vector \\( \\vec{a} \\) by c₁ = ${c1}</p>`;
        renderMathJax();
        
        const scaledA = svg.append("line")
            .attr("class", "vector-path animated-vector")
            .attr("x1", xScale(0))
            .attr("y1", yScale(0))
            .attr("x2", xScale(a.x))
            .attr("y2", yScale(a.y))
            .attr("stroke", "#E41A1C")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .attr("marker-end", "url(#arrowhead)");

        clearStepText();
        const fo2 = svg.append("foreignObject")
            .attr("x", xScale(c1 * a.x / 2) - 75)
            .attr("y", yScale(c1 * a.y / 2) - 30)
            .attr("width", 150)
            .attr("height", 20)
            .append("xhtml:div")
            .style("text-align", "center")
            .style("font-size", "12px")
            .html(`\\( ${c1} \\cdot \\vec{a} = (${(c1 * a.x).toFixed(2)}, ${(c1 * a.y).toFixed(2)}) \\)`);
        renderMathJax();

        scaledA.transition().duration(stepDuration).attr("x2", xScale(c1 * a.x)).attr("y2", yScale(c1 * a.y));
        d3.select("#a-path").transition().duration(stepDuration/2).attr("opacity", 0.3);
        createVectorLabel(svg, xScale(c1 * a.x / 2), yScale(c1 * a.y / 2), "#E41A1C", `c₁\\vec{a}`);
    }, stepDuration + pauseDuration);

    // Step 3: Draw vector b
    setTimeout(() => {
        explanationBox.innerHTML += `<p><strong>Step 3:</strong> Draw vector \\( \\vec{b} \\) (blue)</p>`;
        renderMathJax();
        
        const bLine = svg.append("line")
            .attr("id", "b-path")
            .attr("class", "vector-path")
            .attr("x1", xScale(0))
            .attr("y1", yScale(0))
            .attr("x2", xScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "#377EB8")
            .attr("marker-end", "url(#arrowhead)");

        clearStepText();
        const fo3 = svg.append("foreignObject")
            .attr("x", xScale(b.x/2) - 50)
            .attr("y", yScale(b.y/2) - 30)
            .attr("width", 100)
            .attr("height", 20)
            .append("xhtml:div")
            .style("text-align", "center")
            .style("font-size", "12px")
            .html(`Vector \\( \\vec{b} = (${b.x}, ${b.y}) \\)`);
        renderMathJax();

        bLine.transition().duration(stepDuration).attr("x2", xScale(b.x)).attr("y2", yScale(b.y));
        createVectorLabel(svg, xScale(b.x / 2), yScale(b.y / 2), "#377EB8", "\\vec{b}");
    }, 2 * (stepDuration + pauseDuration));

    // Step 4: Scale vector b by c2
    setTimeout(() => {
        explanationBox.innerHTML += `<p><strong>Step 4:</strong> Scale vector \\( \\vec{b} \\) by c₂ = ${c2}</p>`;
        renderMathJax();
        
        const scaledB = svg.append("line")
            .attr("class", "vector-path animated-vector")
            .attr("x1", xScale(0))
            .attr("y1", yScale(0))
            .attr("x2", xScale(b.x))
            .attr("y2", yScale(b.y))
            .attr("stroke", "#377EB8")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .attr("marker-end", "url(#arrowhead)");

        clearStepText();
        const fo4 = svg.append("foreignObject")
            .attr("x", xScale(c2 * b.x / 2) - 75)
            .attr("y", yScale(c2 * b.y / 2) - 30)
            .attr("width", 150)
            .attr("height", 20)
            .append("xhtml:div")
            .style("text-align", "center")
            .style("font-size", "12px")
            .html(`\\( ${c2} \\cdot \\vec{b} = (${(c2 * b.x).toFixed(2)}, ${(c2 * b.y).toFixed(2)}) \\)`);
        renderMathJax();

        scaledB.transition().duration(stepDuration).attr("x2", xScale(c2 * b.x)).attr("y2", yScale(c2 * b.y));
        d3.select("#b-path").transition().duration(stepDuration/2).attr("opacity", 0.3);
        createVectorLabel(svg, xScale(c2 * b.x / 2), yScale(c2 * b.y / 2), "#377EB8", `c₂\\vec{b}`);
    }, 3 * (stepDuration + pauseDuration));

    // Step 5: Translate c₂b to end of c₁a
    setTimeout(() => {
        explanationBox.innerHTML += "<p><strong>Step 5:</strong> Translate \\( c_2\\vec{b} \\) to start at the end of \\( c_1\\vec{a} \\)</p>";
        renderMathJax();
        
        const translatedB = svg.append("line")
            .attr("class", "vector-path animated-vector")
            .attr("x1", xScale(c1 * a.x))
            .attr("y1", yScale(c1 * a.y))
            .attr("x2", xScale(c1 * a.x))
            .attr("y2", yScale(c1 * a.y))
            .attr("stroke", "#377EB8")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .attr("marker-end", "url(#arrowhead)");

        clearStepText();
        const fo5 = svg.append("foreignObject")
            .attr("x", xScale(c1 * a.x + c2 * b.x / 2) - 75)
            .attr("y", yScale(c1 * a.y + c2 * b.y / 2) - 30)
            .attr("width", 150)
            .attr("height", 20)
            .append("xhtml:div")
            .style("text-align", "center")
            .style("font-size", "12px")
            .html("Translated \\( c_2\\vec{b} \\)");
        renderMathJax();

        translatedB.transition()
            .duration(stepDuration)
            .attr("x2", xScale(c1 * a.x + c2 * b.x))
            .attr("y2", yScale(c1 * a.y + c2 * b.y));
    }, 4 * (stepDuration + pauseDuration));

    // Step 6: Show resultant vector
    setTimeout(() => {
        const resultX = c1 * a.x + c2 * b.x;
        const resultY = c1 * a.y + c2 * b.y;

        explanationBox.innerHTML += `<p><strong>Step 6:</strong> Resultant vector \\( \\vec{v} = (${resultX.toFixed(2)}, ${resultY.toFixed(2)}) \\)</p>`;
        renderMathJax();
        
        const resultLine = svg.append("line")
            .attr("id", "result-path")
            .attr("class", "vector-path")
            .attr("x1", xScale(0))
            .attr("y1", yScale(0))
            .attr("x2", xScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "#4DAF4A")
            .attr("stroke-width", 3)
            .attr("marker-end", "url(#arrowhead)");

        clearStepText();
        const fo6 = svg.append("foreignObject")
            .attr("x", xScale(resultX / 2) - 75)
            .attr("y", yScale(resultY / 2) - 30)
            .attr("width", 150)
            .attr("height", 20)
            .append("xhtml:div")
            .style("text-align", "center")
            .style("font-size", "12px")
            .html(`\\( \\vec{v} = (${resultX.toFixed(2)}, ${resultY.toFixed(2)}) \\)`);
        renderMathJax();

        resultLine.transition()
            .duration(stepDuration)
            .attr("x2", xScale(resultX))
            .attr("y2", yScale(resultY));

        createVectorLabel(svg, xScale(resultX / 2), yScale(resultY / 2), "#4DAF4A", "\\vec{v}");
        updateResultDisplay(resultX, resultY);
    }, 5 * (stepDuration + pauseDuration));

    // Add close button
    setTimeout(() => {
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close Explanation";
        closeButton.className = "btn-secondary";
        closeButton.onclick = function () {
            document.getElementById("step-explanation").remove();
            drawVectors();
        };
        explanationBox.appendChild(closeButton);
    }, 6 * (stepDuration + pauseDuration));
    }

    function resetVectors() {
        document.getElementById("v1x").value = 2;
        document.getElementById("v1y").value = 1;
        document.getElementById("v2x").value = 1;
        document.getElementById("v2y").value = 2;
        document.getElementById("c1").value = 1;
        document.getElementById("c2").value = 1;
        document.getElementById("c1-range").value = 1;
        document.getElementById("c2-range").value = 1;
    
        a = { x: 2, y: 1 };
        b = { x: 1, y: 2 };
        c1 = 1;
        c2 = 1;
    
        svg.selectAll(".step-text").remove();
        svg.selectAll(".animated-vector").remove();
        const explanation = document.getElementById("step-explanation");
        if (explanation) explanation.remove();
    
        drawVectors();
    }

    function updateVectors() {
        a = {
            x: parseFloat(document.getElementById("v1x").value),
            y: parseFloat(document.getElementById("v1y").value)
        };
        b = {
            x: parseFloat(document.getElementById("v2x").value),
            y: parseFloat(document.getElementById("v2y").value)
        };
        drawVectors();
    }

    function updateCombination() {
        c1 = parseFloat(document.getElementById("c1").value);
        c2 = parseFloat(document.getElementById("c2").value);
        drawVectors();
    }

    function syncRangeWithNumber() {
        const rangeId = this.id;
        const numberId = rangeId.replace("-range", "");
        document.getElementById(numberId).value = this.value;
        updateCombination();
    }

    function updateResultDisplay(x, y) {
        document.getElementById("combination-formula").textContent = 
            `v = ${c1}·(${a.x},${a.y}) + ${c2}·(${b.x},${b.y}) = (${x.toFixed(2)},${y.toFixed(2)})`;
        
        const magnitude = Math.sqrt(x*x + y*y);
        const angle = Math.atan2(y, x) * 180 / Math.PI;
        
        document.getElementById("magnitude").textContent = magnitude.toFixed(2);
        document.getElementById("angle").textContent = angle.toFixed(2) + "°";
    }

    function checkProblem1() {
        const c1 = parseFloat(document.getElementById("p1-c1").value);
        const c2 = parseFloat(document.getElementById("p1-c2").value);
        
        const resultX = c1 * 1 + c2 * 3;
        const resultY = c1 * 2 + c2 * 1;
        
        const feedback = document.getElementById("p1-feedback");
        
        if (Math.abs(resultX - 5) < 0.01 && Math.abs(resultY - 7) < 0.01) {
            feedback.textContent = "✓ Correct! Well done!";
            feedback.className = "feedback correct";
        } else {
            feedback.textContent = "✗ Not quite right. Try again!";
            feedback.className = "feedback incorrect";
        }
    }

    function checkProblem2(button) {
        const answer = button.getAttribute("data-answer");
        const feedback = document.getElementById("p2-feedback");
        
        if (answer === "yes") {
            feedback.textContent = "✓ Correct! (4,6) = 0·(1,1.5) + 2·(2,3)";
            feedback.className = "feedback correct";
        } else {
            feedback.textContent = "✗ Actually, it can be expressed as a linear combination!";
            feedback.className = "feedback incorrect";
        }
    }

    function toggleHint() {
        const hintBox = document.getElementById("p1-hint");
        hintBox.style.display = hintBox.style.display === "none" ? "block" : "none";
    }

    function toggleSolution() {
        const solutionBox = document.getElementById("p1-solution");
        solutionBox.style.display = solutionBox.style.display === "none" ? "block" : "none";
    }

    function toggleExplanation() {
        const explanation = document.getElementById("p2-explanation");
        explanation.style.display = explanation.style.display === "none" ? "block" : "none";
    }

    // Helper functions
    function calculateMagnitude(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    function calculateAngle(vector) {
        return Math.atan2(vector.y, vector.x) * 180 / Math.PI;
    }

    function showTooltip(content) {
        const tooltip = document.getElementById("tooltip");
        tooltip.innerHTML = content;
        tooltip.style.opacity = 1;
    }

    function moveTooltip() {
        const tooltip = document.getElementById("tooltip");
        tooltip.style.left = (d3.event.pageX + 10) + "px";
        tooltip.style.top = (d3.event.pageY - 10) + "px";
    }

    function hideTooltip() {
        const tooltip = document.getElementById("tooltip");
        tooltip.style.opacity = 0;
    }
});