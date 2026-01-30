import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

const WordCloud = ({ words, width = 800, height = 500 }) => {
    const ref = useRef();
    const [renderedWords, setRenderedWords] = useState([]);

    // Sea Horse Palette: Light Silver, Muted Blue-Grey, Deep Navy, Creams
    // Approximated from description and common "Sea Horse" palettes + Logo context
    const colors = [
        '#FFFFFF', // White
        '#E0E7FF', // Light Silver/Blue
        '#A8DADC', // Cyan
        '#457B9D', // Muted Blue
        '#1D3557', // Deep Navy
        '#F1FAEE', // Cream
        '#8ecae6', // Light Blue
        '#B8C1EC', // Lavenderish Grey
    ];

    useEffect(() => {
        if (!words || words.length === 0) return;

        const maxVal = d3.max(words, d => d.value) || 1;
        const minVal = d3.min(words, d => d.value) || 1;

        const fontSizeScale = d3.scalePow()
            .exponent(0.5)
            .domain([minVal, maxVal])
            .range([12, 60]); // Increased min size to 12px as requested

        // Standard d3-cloud layout without masking
        const layout = cloud()
            .size([width, height])
            .words(words.map(d => ({ text: d.text, value: d.value })))
            .padding(1)
            .rotate(() => (~~(Math.random() * 2) * 90))
            .font("Impact")
            .fontSize(d => fontSizeScale(d.value))
            .on("end", (computedWords) => {
                setRenderedWords(computedWords);
            });

        layout.start();

    }, [words, width, height]);

    return (
        <div className="word-cloud-container" style={{
            position: 'relative',
            width: width,
            height: height,
        }}>
            <svg width={width} height={height} ref={ref} style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Visual Debug: Optional background image usage */}
                <g transform={`translate(${width / 2},${height / 2})`}>
                    {renderedWords.map((w, i) => (
                        <text
                            key={`${w.text}-${i}`}
                            style={{
                                fontFamily: 'Inter, system-ui, sans-serif',
                                fill: colors[i % colors.length], // Cycle through palette
                                opacity: 0.9,
                                transition: 'all 0.5s ease',
                                cursor: 'pointer'
                            }}
                            textAnchor="middle"
                            transform={`translate(${w.x},${w.y})rotate(${w.rotate})`}
                            fontSize={w.size}
                        >
                            {w.text}
                        </text>
                    ))}
                </g>
            </svg>
        </div>
    );
};

export default WordCloud;
