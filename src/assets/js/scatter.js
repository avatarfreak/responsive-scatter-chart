import * as d3 from "d3";

let dataset = d3.json("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json").then(res => res);
dataset.then(data => {
  //hide preloader
  document.querySelector("#loading").remove();

  //event listener for responsive behaviour
  window.addEventListener("resize", render);

  //initail rendering of pages
  render();

  //rendering function get fire when browser is resize
  function render() {
    //targeting div with class display__svg
    const svg = d3.select(".display__svg");

    //margin convention practice
    const windowsize = {
      height: document.querySelector(".display").clientHeight,
      width: document.querySelector(".display").clientWidth,
      margin: { top: 20, right: 100, bottom: 180, left: 150 }
    };

    //calling graph generator
    drawchart(data, svg, windowsize);
  }
});

/**
 * @param {Object} data dataset
 * @param {string} selection svg element
 * @param {Object} props dimension
 */
function drawchart(data, selection, props) {
  //destructing
  const { width, height, margin } = props;

  //append svg element on page
  let svg = selection.selectAll("svg").data([null]);
  svg = svg
    .enter()
    .append("svg")
    .merge(svg)
    .attr("width", width)
    .attr("height", height);

  //calculate inner height
  const innerHeight = height - margin.top - margin.bottom;

  //calculate inner width
  const innerWidth = width - margin.left - margin.right;

  //retreiving time
  const time = [
    ...data.map(data => {
      //converting string time to js time
      let parseTime = data.Time.split(":");
      return new Date(1970, 0, 1, 0, parseTime[0], parseTime[1]);
    })
  ];

  // retrieving all the years
  const years = [...data.map(data => data.Year)];

  //create x scale

  const xScale = d3
    .scaleLinear()

    .domain([d3.min(years) - 1, d3.max(years) + 1])
    .range([0, innerWidth]);

  //creating responsive tick along the x-axis
  const xticksdensity = 70;

  //create an xaxis component with d3.axisbottom
  const xaxis = d3
    .axisBottom(xScale)

    .tickFormat(d3.format("d"))
    .ticks(innerWidth / xticksdensity);

  //call the xaxis in a group tag
  let xaxisgroup = svg.selectAll("#x-axis").data([null]);
  xaxisgroup = xaxisgroup
    .enter()
    .append("g")
    .attr("id", "x-axis")
    .merge(xaxisgroup)
    .attr("transform", `translate(${margin.left},${innerHeight + margin.top})`)
    .call(xaxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

  //create yScale
  const yScale = d3
    .scaleTime()
    .domain([d3.min(time), d3.max(time)])
    .range([0, innerHeight])
    .nice();

  //creating responsive tick along the y-axis
  const yticksdensity = 70;

  //create an yaxis component with d3.axisLeft
  const yaxis = d3
    .axisLeft(yScale)
    .tickFormat(d3.timeFormat("%M:%S"))
    .ticks(innerHeight / yticksdensity);

  //call the xaxis in a group tag
  let yaxisgroup = svg.selectAll("#y-axis").data([null]);
  yaxisgroup = yaxisgroup
    .enter()
    .append("g")
    .attr("id", "y-axis")
    .merge(yaxisgroup)
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  yaxisgroup.call(yaxis);

  //append labels in y axis
  const yaxislabel = yaxisgroup.selectAll(".y-axis-label").data([null]);
  yaxislabel
    .enter()
    .append("text")
    .attr("class", "y-axis-label")
    .merge(yaxislabel)
    .attr("fill", "#3cb371")
    .text("Time in Minutes")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 5)
    .attr("y", -60);

  //tootip for displaying information
  const tooltip = selection
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("padding", "5px 7px")
    .style("border", "1px #333 solid")
    .style("border-radius", "5px")
    .style("opacity", "0");

  //create cross hair for drop axis
  const dropAxis = svg
    .append("g")
    .attr("class", "dropAxis")
    .style("opacity", 0)
    .attr("stroke", "#7cfc00")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const xdashedLine = dropAxis
    .append("line")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", 4);

  const ydashedLine = dropAxis
    .append("line")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", 4);

  
  //color scheme and range
  const color = d3.scaleOrdinal(d3.schemeAccent);

  //append circle to the svg
  let circle = svg.selectAll(".dot").data(data);
  circle = circle
    .enter()
    .append("circle")
    .merge(circle)
    .attr("class", "dot")
    .attr("data-xvalue", d => d.Year)
    .attr("data-yvalue", (d, i) => time[i].toISOString())
    .attr("cx", (d, i) => xScale(d.Year[i]))
    .attr("cy", (d, i) => innerHeight)
    .attr("r", 8)
    .style("fill", function(d) {
      return color(d.Doping != "");
    })
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .on("mouseover", function(d, i) {
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 1);
      tooltip
        .html(
          `
          <label>Name: <b>${d.Name}</b> </label> 
          <br>
          <label>Country:<b>${d.Nationality}</b></label> 
          <br>
          <label>year: <b>${d.Year}</b> </label> 
          <br>
          <label>Time:<b>${d.Time}</b></label> 
          <br/>
          <label><p><em> ${d.Doping}</em></p></label> 
          `
        )
        .attr("data-year", d.Year)
        .style("left", `${d3.event.pageX}px`)
        .style("top", `${d3.event.pageY}px`);

      dropAxis.style("opacity", 1);

      xdashedLine
        .attr("x1", xScale(d.Year))
        .attr("x2", xScale(d.Year))
        .attr("y1", innerHeight)
        .attr("y2", yScale(time[i]));

      ydashedLine
        .attr("x1", 0)
        .attr("x2", xScale(d.Year))
        .attr("y1", yScale(time[i]))
        .attr("y2", yScale(time[i]));

      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 20);
    })
    .on("mouseout", function() {
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0);
      
      dropAxis.style("opacity", 0);

      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 8);
    });
  //Adding Legend to Svg
  let legend = svg.selectAll(".legend").data([null]);
  legend = legend
    .enter()
    .append("g")
    .attr("id", "legend")
    .merge(legend)
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${innerWidth - i}, ${margin.top})`);

  // Add legend information
  let text = legend
    .selectAll(".legend-text")
    .data(["Riders with doping allegations", "No doping allegations"]);
  text = text
    .enter()
    .append("text")
    .attr("class", "legend-text")
    .merge(text)

    .attr("y", (d, i) => i * 30 + 5)
    .attr("x", 15)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("fill", d => color(d == "Riders with doping allegations"))
    .text(d => d);

  let circ = legend
    .selectAll("circle")
    .data(["Riders with doping allegations", "No doping allegations"]);
  circ = circ
    .enter()
    .append("circle")
    .merge(circ)
    .attr("cy", (d, i) => i * 30)
    .attr("r", 9)
    .style("fill", d => color(d == "Riders with doping allegations"))
    .style("stroke", "#fff");

  //animate
  circle
    .transition()
    .delay((d, i) => i * 30)
    .duration(2000)
    .ease(d3.easeCircle)
    .ease(d3.easeElastic)
    .attr("cx", (d, i) => xScale(d.Year))
    .attr("cy", (d, i) => yScale(time[i]));
}
