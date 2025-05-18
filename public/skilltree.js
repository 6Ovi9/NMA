// Initialize skill tree data
window.skills = [
    { id: 'start', name: 'Comenzar', unlocked: true, x: 960, y: 880, style: 'celestial' },
    { id: 'sciences', name: 'Ciencias', unlocked: false, x: 910, y: 580, style: 'atomic', hasSubNodes: true },
    { id: 'humanities', name: 'Humanidades', unlocked: false, x: 860, y: 720, style: 'scroll', hasSubNodes: true },
    { id: 'languages', name: 'Idiomas', unlocked: false, x: 1010, y: 580, style: 'crystal', hasSubNodes: true },
    { id: 'technology', name: 'Tecnología', unlocked: false, x: 1060, y: 720, style: 'tech' }
];

// Function to update skill unlocked status
function updateSkillUnlocked(skillId, unlocked) {
    const skill = window.skills.find(s => s.id === skillId);
    if (skill) {
        const wasUnlocked = skill.unlocked;
        skill.unlocked = unlocked;
        console.log(`Skill ${skillId} unlocked state updated: ${wasUnlocked} -> ${unlocked}`);
        return true;
    }
    console.warn(`Skill ${skillId} not found in skills array`);
    return false;
}

// Check unlocked skills on page load
window.checkUnlockedSkills = function() {
    console.log('\n=== Checking Unlocked Skills ===');
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, only unlocking start node');
        window.skills.forEach(skill => {
            skill.unlocked = skill.id === 'start';
            console.log(`Reset skill ${skill.id} to:`, skill.unlocked);
        });
        renderSkillTree();
        return;
    }

    console.log('Token found:', token.substring(0, 10) + '...');
    console.log('Making request to /api/unlock?code=check');
    
    fetch('/api/unlock?code=check', {
        headers: { 
            'Authorization': 'Bearer ' + token
        }
    })
    .then(res => {
        console.log('Server response status:', res.status);
        if (!res.ok) {
            throw new Error(`Server returned ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        console.log('Received server response:', data);
        
        if (!data.success) {
            console.error('Server indicated failure:', data.message);
            return;
        }
        
        if (!Array.isArray(data.unlockedSkills)) {
            console.error('Invalid unlockedSkills format:', data.unlockedSkills);
            return;
        }

        console.log(`Updating skill states for user ${data.username} with:`, data.unlockedSkills);
        
        // First reset all skills except 'start'
        window.skills.forEach(skill => {
            if (skill.id !== 'start') {
                skill.unlocked = false;
            }
        });
        
        // Then update unlocked ones
        let changes = 0;
        window.skills.forEach(skill => {
            const shouldBeUnlocked = data.unlockedSkills.includes(skill.id) || skill.id === 'start';
            if (updateSkillUnlocked(skill.id, shouldBeUnlocked)) {
                changes++;
            }
        });
        
        console.log(`Updated ${changes} skill states`);
        console.log('Final skill states:', window.skills.map(s => ({ id: s.id, unlocked: s.unlocked })));
        
        // Only re-render if we made changes
        if (changes > 0) {
            console.log('Re-rendering skill tree');
            renderSkillTree();
        }
    })
    .catch(error => {
        console.error('Error checking unlocked skills:', error);
    });
};

// Export skills for other modules to use
window.skills = skills;

// Define the exact connections we want - technology only connects to start now
const links = [
    { source: 'start', target: 'sciences' },
    { source: 'start', target: 'humanities' },
    { source: 'start', target: 'languages' },
    { source: 'start', target: 'technology' }
];

function isLoggedIn() {
  return localStorage.getItem('token') !== null;
}

// Listen for login state changes
window.addEventListener('storage', function(e) {
  if (e.key === 'token') {
    renderSkillTree();
  }
});

function renderSkillTree() {
    console.log('Rendering skill tree with skills:', window.skills);
    
    // Remove any previous SVG
    d3.select('#skill-tree').selectAll('*').remove();

    // Create the SVG container
    const svg = d3.select('#skill-tree')
        .append('svg')
        .attr('width', '100vw')
        .attr('height', '100vh')
        .attr('viewBox', '0 0 1920 1080')
        .style('position', 'fixed')
        .style('top', '50%')
        .style('left', '50%')
        .style('transform', 'translate(-50%, -50%)');

    // Create a purple nebula background effect
    const defs = svg.append('defs');
  
    // Nebula gradients
    defs.append('radialGradient')
      .attr('id', 'purpleNebula')
      .html(`
        <stop offset="0%" stop-color="#2a1b3d"/>
        <stop offset="50%" stop-color="#1a0f24"/>
        <stop offset="100%" stop-color="#0a080c"/>
      `);

    // Star filters
    defs.html(defs.html() + `
      <filter id="starlight" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="
          1 0 0 0 0
          0 1 0 0 0
          0 1 0 0 0
          0 0 0 2.5 0
        " result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="bigStarlight" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="
          1 0 0 0 0
          0 1 0 0 0
          0 1 0 0 0
          0 0 0 3 0
        " result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `);

    // Add the nebula background
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#purpleNebula)');

    // Enhanced defs for nodes
    defs.html(defs.html() + `
      <radialGradient id="celestialGradient">
        <stop offset="0%" stop-color="#ffd700"/>
        <stop offset="70%" stop-color="#ffa500"/>
        <stop offset="100%" stop-color="#ff8c00"/>
      </radialGradient>

      <radialGradient id="atomicGradient">
        <stop offset="0%" stop-color="#88ccff"/>
        <stop offset="70%" stop-color="#4499ff"/>
        <stop offset="100%" stop-color="#0066cc"/>
      </radialGradient>

      <radialGradient id="scrollGradient">
        <stop offset="0%" stop-color="#ffeedd"/>
        <stop offset="70%" stop-color="#ddccbb"/>
        <stop offset="100%" stop-color="#ccbb99"/>
      </radialGradient>

      <radialGradient id="crystalGradient">
        <stop offset="0%" stop-color="#ff88ff"/>
        <stop offset="70%" stop-color="#ee77ee"/>
        <stop offset="100%" stop-color="#cc66cc"/>
      </radialGradient>

      <radialGradient id="techGradient">
        <stop offset="0%" stop-color="#00ff99"/>
        <stop offset="70%" stop-color="#00cc77"/>
        <stop offset="100%" stop-color="#009955"/>
      </radialGradient>

      <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="
          1 0 0 0 0
          0 1 0 0 0
          0 1 0 0 0
          0 0 0 2 0
        " result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="locked-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="
          1 0 0 0 0
          0 1 0 0 0
          0 1 0 0 0
          0 0 0 1 0
        " result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="node-hover" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="
          1 0 0 0 0
          0 1 0 0 0
          0 1 0 0 0
          0 0 0 2.5 0
        " result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `);

    // Add some nebula cloud effects
    const nebulaGroup = svg.append('g').attr('class', 'nebula-effects');
  
    // Create nebula clouds
    const cloudCount = 3;
    for (let i = 0; i < cloudCount; i++) {
      const x = (i * 800) + Math.random() * 200;
      const y = 200 + Math.random() * 600;
      
      nebulaGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 300 + Math.random() * 200)
        .attr('fill', 'rgba(89, 55, 136, 0.1)')
        .style('filter', 'blur(100px)');
      
      nebulaGroup.append('circle')
        .attr('cx', x + 100)
        .attr('cy', y - 50)
        .attr('r', 200 + Math.random() * 150)
        .attr('fill', 'rgba(147, 51, 166, 0.07)')
        .style('filter', 'blur(80px)');
    }

    // Create background stars
    const starGroup = svg.append('g').attr('class', 'background-stars');
    const starCount = 200; // Reduced count for better performance

    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * 1920;
      const y = Math.random() * 1080;
      const size = Math.random();
      const group = starGroup.append('g')
        .attr('transform', `translate(${x},${y})`);

      if (size < 0.7) {
        // Small twinkling stars
        group.append('circle')
          .attr('r', 1)
          .attr('fill', 'white')
          .attr('opacity', 0.6 + Math.random() * 0.4)
          .attr('class', 'twinkle-star');
      } else if (size < 0.9) {
        // Medium stars with cross glow
        const starSize = 2;
        
        // Core
        group.append('circle')
          .attr('r', starSize)
          .attr('fill', 'white')
          .style('filter', 'url(#starlight)');
        
        // Horizontal flare
        group.append('line')
          .attr('x1', -starSize * 4)
          .attr('x2', starSize * 4)
          .attr('y1', 0)
          .attr('y2', 0)
          .attr('stroke', 'white')
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.6);
        
        // Vertical flare
        group.append('line')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', -starSize * 4)
          .attr('y2', starSize * 4)
          .attr('stroke', 'white')
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.6);
      } else {
        // Large Skyrim-style stars with strong glow
        const starSize = 3;
        
        // Main glow
        group.append('circle')
          .attr('r', starSize * 3)
          .attr('fill', 'white')
          .attr('opacity', 0.2)
          .style('filter', 'url(#bigStarlight)');
        
        // Core
        group.append('circle')
          .attr('r', starSize)
          .attr('fill', 'white')
          .style('filter', 'url(#bigStarlight)');
        
        // Diagonal flares
        [45, 135, 225, 315].forEach(angle => {
          const rad = (angle * Math.PI) / 180;
          const length = starSize * 6;
          
          group.append('line')
            .attr('x1', Math.cos(rad) * starSize)
            .attr('y1', Math.sin(rad) * starSize)
            .attr('x2', Math.cos(rad) * length)
            .attr('y2', Math.sin(rad) * length)
            .attr('stroke', 'white')
            .attr('stroke-width', 0.5)
            .attr('opacity', 0.4);
        });
      }
    }

    // Draw connections first (so they're under the nodes)
    links.forEach(link => {
        const source = window.skills.find(s => s.id === link.source);
        const target = window.skills.find(s => s.id === link.target);
        
        if (!source || !target) return;
        
        // Only show connections if source is unlocked
        if (!source.unlocked) return;
        
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const sourceRadius = source.id === 'start' ? 24 : 20;
        const targetRadius = target.id === 'start' ? 24 : 20;
        
        // Calculate curve control points
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Curve control point offset (adjust these values to control the curve)
        const curveOffset = dist * 0.2;
        
        // Calculate control points for the curve
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2 - curveOffset;
        
        // Calculate start and end points considering node radius
        const sourceX = source.x + Math.cos(angle) * sourceRadius;
        const sourceY = source.y + Math.sin(angle) * sourceRadius;
        const targetX = target.x - Math.cos(angle) * targetRadius;
        const targetY = target.y - Math.sin(angle) * targetRadius;

        // Create the curved path
        const path = d3.path();
        path.moveTo(sourceX, sourceY);
        path.quadraticCurveTo(midX, midY, targetX, targetY);
        
        // Draw the curved connection line
        svg.append('path')
          .attr('d', path.toString())
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .attr('fill', 'none')
          .attr('opacity', target.unlocked ? 0.8 : 0.3)
          .style('filter', 'url(#line-glow)');

        // Draw decorative dots along the path
        const totalLength = Math.sqrt(
          Math.pow(targetX - sourceX, 2) + 
          Math.pow(targetY - sourceY, 2)
        );
        const numDots = Math.floor(totalLength / 40);
        
        for (let i = 1; i < numDots; i++) {
          const t = i / numDots;
          // Quadratic bezier formula
          const x = Math.pow(1-t, 2) * sourceX + 
                   2 * (1-t) * t * midX + 
                   Math.pow(t, 2) * targetX;
          const y = Math.pow(1-t, 2) * sourceY + 
                   2 * (1-t) * t * midY + 
                   Math.pow(t, 2) * targetY;
          
          svg.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 1.5)
            .attr('fill', '#fff')
            .attr('opacity', target.unlocked ? 0.6 : 0.2)
            .style('filter', 'url(#line-glow)');
        }
      });

    // Add enhanced node filters
    defs.html(defs.html() + `
      <filter id="node-glow" x="-150%" y="-150%" width="400%" height="400%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="
          1 0 0 0 0
          0 1 0 0 0
          0 1 0 0 0
          0 0 0 3 0
        " result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="node-rays" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
        <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
        <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1.5" 
                           specularExponent="20" lighting-color="#fff" result="specular">
          <fePointLight x="-100" y="-100" z="100"/>
        </feSpecularLighting>
        <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" 
                     k1="0" k2="1" k3="1" k4="0"/>
      </filter>

      <radialGradient id="node-star-core">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="40%" stop-color="#ffffffcc"/>
        <stop offset="100%" stop-color="#ffffff00"/>
      </radialGradient>
    `);

    // Draw enhanced crystal-like nodes
    window.skills.forEach(skill => {
        const isUnlocked = skill.unlocked;
        const baseRadius = skill.id === 'start' ? 24 : 20;
        const group = svg.append('g')
          .attr('class', 'skill-node')
          .attr('transform', `translate(${skill.x},${skill.y})`)
          .style('cursor', isUnlocked && skill.id !== 'start' ? 'pointer' : 'default')
          .attr('data-id', skill.id)          .on('click', () => {
            if (isUnlocked && skill.id !== 'start') {
              if (skill.id === 'technology') {
                window.location.href = 'technology.html';
              } else if (skill.hasSubNodes) {
                window.location.href = `${skill.id}.html`;
              }
            }
          });

        if (isUnlocked) {
          // Add hover effect for unlocked nodes with smooth transition
          group.on('mouseover', function() {
            d3.select(this)
              .transition()
              .duration(300)
              .attr('transform', `translate(${skill.x},${skill.y}) scale(1.1)`);
            
            d3.select(this).selectAll('.node-element')
              .transition()
              .duration(300)
              .style('filter', 'url(#node-hover)');
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(300)
              .attr('transform', `translate(${skill.x},${skill.y}) scale(1)`);
            
            d3.select(this).selectAll('.node-element')
              .transition()
              .duration(300)
              .style('filter', 'url(#node-glow)');
          });

          switch (skill.style) {
            case 'celestial':
              // Celestial body with animated rings
              const celestialNode = group.append('g')
                .attr('class', 'node-center');
                
              // Core
              celestialNode.append('circle')
                .attr('class', 'node-element')
                .attr('r', baseRadius)
                .attr('fill', 'url(#celestialGradient)')
                .attr('opacity', 0.9)
                .style('filter', 'url(#node-glow)');

              // Static rings
              [0, 45, 90].forEach((angle) => {
                celestialNode.append('ellipse')
                  .attr('class', 'node-element')
                  .attr('rx', baseRadius * 1.5)
                  .attr('ry', baseRadius * 0.4)
                  .attr('transform', `rotate(${angle})`)
                  .attr('fill', 'none')
                  .attr('stroke', '#ffd700')
                  .attr('stroke-width', 1)
                  .attr('opacity', 0.4)
                  .style('filter', 'url(#node-glow)');
              });
              break;

            case 'atomic':
              // Sciences node
              const atomicNode = group.append('g')
                .attr('class', 'node-center');

              // Static orbits
              [0, 60, 120].forEach((angle, i) => {
                const orbitRadius = baseRadius * (1.2 + i * 0.15);
                
                atomicNode.append('ellipse')
                  .attr('class', 'node-element')
                  .attr('rx', orbitRadius)
                  .attr('ry', orbitRadius * 0.4)
                  .attr('transform', `rotate(${angle})`)
                  .attr('fill', 'none')
                  .attr('stroke', '#88ccff')
                  .attr('stroke-width', 1.5)
                  .attr('opacity', 0.5)
                  .style('filter', 'url(#node-glow)');

                // Pulsing electrons
                atomicNode.append('circle')
                  .attr('class', 'node-element electron')
                  .attr('cx', orbitRadius)
                  .attr('cy', 0)
                  .attr('r', 2)
                  .attr('fill', '#88ccff')
                  .attr('opacity', 0.8)
                  .attr('transform', `rotate(${angle})`)
                  .style('filter', 'url(#node-glow)')
                  .style('animation-delay', `${i * -0.6}s`);
              });

              // Nucleus
              atomicNode.append('circle')
                .attr('class', 'node-element')
                .attr('r', baseRadius * 0.5)
                .attr('fill', 'url(#atomicGradient)')
                .attr('opacity', 0.9)
                .style('filter', 'url(#node-glow)');
              break;

            case 'scroll':
              // Humanities node
              const scrollNode = group.append('g')
                .attr('class', 'node-center');

              // Scroll paper
              scrollNode.append('path')
                .attr('class', 'node-element')
                .attr('d', `M${-baseRadius},0 
                           C${-baseRadius},${-baseRadius * 0.8} 
                           ${baseRadius},${-baseRadius * 0.8} 
                           ${baseRadius},0
                           C${baseRadius},${baseRadius * 0.8}
                           ${-baseRadius},${baseRadius * 0.8}
                           ${-baseRadius},0`)
                .attr('fill', 'url(#scrollGradient)')
                .attr('opacity', 0.7)
                .attr('stroke', '#ddccbb')
                .attr('stroke-width', 1)
                .style('filter', 'url(#node-glow)');

              // Scroll edges
              [-1, 1].forEach(side => {
                scrollNode.append('path')
                  .attr('class', 'node-element')
                  .attr('d', `M${side * baseRadius},${-baseRadius * 0.2}
                           C${side * (baseRadius + 6)},${-baseRadius * 0.2}
                           ${side * (baseRadius + 6)},${baseRadius * 0.2}
                           ${side * baseRadius},${baseRadius * 0.2}`)
                  .attr('fill', 'none')
                  .attr('stroke', '#ddccbb')
                  .attr('stroke-width', 1)
                  .attr('opacity', 0.8)
                  .style('filter', 'url(#node-glow)');
              });
              break;

            case 'crystal':
              // Languages node
              const crystalNode = group.append('g')
                .attr('class', 'node-center');

              // Crystal body
              crystalNode.append('path')
                .attr('class', 'node-element crystal-facet')
                .attr('d', `M0,${-baseRadius}
                           L${baseRadius * 0.8},0
                           L0,${baseRadius}
                           L${-baseRadius * 0.8},0 Z`)
                .attr('fill', 'url(#crystalGradient)')
                .attr('opacity', 0.7)
                .attr('stroke', '#ff88ff')
                .attr('stroke-width', 1.5);

              // Inner facets
              crystalNode.append('path')
                .attr('class', 'node-element crystal-facet')
                .attr('d', `M0,${-baseRadius * 0.5}
                           L${baseRadius * 0.4},0
                           L0,${baseRadius * 0.5}
                           L${-baseRadius * 0.4},0 Z`)
                .attr('fill', '#ff88ff')
                .attr('opacity', 0.3)
                .attr('stroke', '#ff88ff')
                .attr('stroke-width', 1)
                .style('animation-delay', '-1s');
              break;

            case 'tech':
              // Technology node
              const techNode = group.append('g')
                .attr('class', 'node-center');

              // Hexagon
              const hexPoints = Array.from({length: 6}, (_, i) => {
                const angle = (i * 60) * Math.PI / 180;
                return `${baseRadius * 0.8 * Math.cos(angle)},${baseRadius * 0.8 * Math.sin(angle)}`;
              }).join(' ');

              techNode.append('polygon')
                .attr('class', 'node-element')
                .attr('points', hexPoints)
                .attr('fill', 'url(#techGradient)')
                .attr('opacity', 0.7)
                .attr('stroke', '#00ff99')
                .attr('stroke-width', 1.5)
                .style('filter', 'url(#node-glow)');

              // Circuit lines
              [0, 60, 120].forEach((angle, i) => {
                const line = techNode.append('g')
                  .attr('class', 'tech-circuit')
                  .attr('transform', `rotate(${angle})`)
                  .style('animation-delay', `${i * -0.3}s`);

                line.append('line')
                  .attr('class', 'node-element')
                  .attr('x1', 0)
                  .attr('y1', 0)
                  .attr('x2', baseRadius * 0.6)
                  .attr('y2', 0)
                  .attr('stroke', '#00ff99')
                  .attr('stroke-width', 1)
                  .attr('opacity', 0.7);

                line.append('circle')
                  .attr('class', 'node-element')
                  .attr('cx', baseRadius * 0.6)
                  .attr('cy', 0)
                  .attr('r', 2)
                  .attr('fill', '#00ff99')
                  .attr('opacity', 0.8);
              });

              // Center point
              techNode.append('circle')
                .attr('class', 'node-element')
                .attr('r', 3)
                .attr('fill', '#00ff99')
                .attr('opacity', 0.9)
                .style('filter', 'url(#node-glow)');
              break;
          }

        } else {
          // Locked node version with subtle animation
          const lockedNode = group.append('g')
            .attr('class', 'node-center');

          const colors = {
            celestial: { fill: '#ffd70033', stroke: '#ffd70066' },
            atomic: { fill: '#88ccff33', stroke: '#88ccff66' },
            scroll: { fill: '#ffeedd33', stroke: '#ffeedd66' },
            crystal: { fill: '#ff88ff33', stroke: '#ff88ff66' },
            tech: { fill: '#00ff9933', stroke: '#00ff9966' }
          }[skill.style];

          const lockedShape = lockedNode.append('g')
            .attr('class', 'locked-node');

          switch (skill.style) {
            case 'celestial':
              lockedNode.append('circle')
                .attr('r', baseRadius * 0.8)
                .attr('fill', colors.fill)
                .attr('stroke', colors.stroke)
                .attr('stroke-width', 1)
                .style('filter', 'url(#locked-glow)');
              break;

            case 'atomic':
              lockedNode.append('circle')
                .attr('r', baseRadius * 0.8)
                .attr('fill', colors.fill)
                .attr('stroke', colors.stroke)
                .attr('stroke-width', 1)
                .style('filter', 'url(#locked-glow)');
              break;

            case 'scroll':
              lockedNode.append('rect')
                .attr('x', -baseRadius * 0.7)
                .attr('y', -baseRadius * 0.7)
                .attr('width', baseRadius * 1.4)
                .attr('height', baseRadius * 1.4)
                .attr('fill', colors.fill)
                .attr('stroke', colors.stroke)
                .attr('stroke-width', 1)
                .style('filter', 'url(#locked-glow)');
              break;

            case 'crystal':
              lockedNode.append('path')
                .attr('d', `M0,${-baseRadius * 0.7}
                           L${baseRadius * 0.7},0
                           L0,${baseRadius * 0.7}
                           L${-baseRadius * 0.7},0 Z`)
                .attr('fill', colors.fill)
                .attr('stroke', colors.stroke)
                .attr('stroke-width', 1)
                .style('filter', 'url(#locked-glow)');
              break;

            case 'tech':
              const hexPoints = Array.from({length: 6}, (_, i) => {
                const angle = (i * 60) * Math.PI / 180;
                return `${baseRadius * 0.7 * Math.cos(angle)},${baseRadius * 0.7 * Math.sin(angle)}`;
              }).join(' ');

              lockedNode.append('polygon')
                .attr('points', hexPoints)
                .attr('fill', colors.fill)
                .attr('stroke', colors.stroke)
                .attr('stroke-width', 1)
                .style('filter', 'url(#locked-glow)');
              break;
          }
        }

        // Skill name label
        group.append('text')
          .attr('y', baseRadius * 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .attr('opacity', isUnlocked ? 0.8 : 0.3)
          .attr('font-size', '16px')
          .text(skill.name)
          .style('filter', isUnlocked ? 'url(#node-glow)' : null);
    });

  // Rest of the code remains the same...
}

// Function to unlock a node with animation
function unlockNode(nodeId) {
  const node = skills.find(s => s.id === nodeId);
  if (node && !node.unlocked) {
    node.unlocked = true;
    
    // Trigger unlock animation
    const svg = d3.select('#skill-tree svg');
    const nodeElem = svg.selectAll('.node').filter((d, i, nodes) => 
      d3.select(nodes[i]).attr('points')?.includes(`${node.x},${node.y}`)
    );
    
    // Flash effect
    nodeElem
      .style('filter', 'url(#node-off)')
      .transition()
      .duration(300)
      .style('filter', 'url(#node-on)')
      .attr('opacity', 1)
      .transition()
      .duration(200)
      .attr('transform', 'scale(1.5)')
      .transition()
      .duration(400)
      .attr('transform', 'scale(1)');
    
    // Re-render to update connections
    renderSkillTree();
  }
}

// Check unlocked skills on page load
window.checkUnlockedSkills = function() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.skills.forEach(skill => {
      skill.unlocked = skill.id === 'start';
    });
    window.unlockedSkillsFromBackend = null;
    renderSkillTree();
    return;
  }

  fetch('/api/unlock?code=check', {
    headers: { 
      'Authorization': 'Bearer ' + token
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.unlockedSkills) {
      console.log('Updating unlocked skills:', data.unlockedSkills);
      window.unlockedSkillsFromBackend = data.unlockedSkills;
      window.skills.forEach(skill => {
        skill.unlocked = data.unlockedSkills.includes(skill.id) || skill.id === 'start';
        console.log(`Skill ${skill.id} unlocked:`, skill.unlocked);
      });
      renderSkillTree();
    }
  })
  .catch(error => {
    console.error('Error checking unlocked skills:', error);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  // Initial render
  renderSkillTree();
  window.checkUnlockedSkills();

  // Watch for login state changes
  const observer = new MutationObserver(() => {
    window.checkUnlockedSkills();
  });

  // Observe the user-section for changes
  const userSection = document.getElementById('user-section');
  if (userSection) {
    observer.observe(userSection, { attributes: true, attributeFilter: ['style'] });
  }
});

// Add animations to defs with scale-only transforms
window.addEventListener('load', () => {
  const svg = d3.select('#skill-tree svg defs');

  svg.append('style')
    .text(`
      @keyframes gentle-pulse {
        0%, 100% { 
          transform: scale(1);
          opacity: 0.7;
        }
        50% { 
          transform: scale(1.1);
          opacity: 0.9;
        }
      }

      .skill-node {
        transform-origin: center;
      }

      .node-center {
        transform-box: fill-box;
        transform-origin: center;
      }

      .electron {
        animation: gentle-pulse 2s ease-in-out infinite;
        transform-origin: center;
      }

      .crystal-facet {
        animation: gentle-pulse 3s ease-in-out infinite;
        transform-origin: center;
      }

      .tech-circuit {
        animation: gentle-pulse 2s ease-in-out infinite;
        transform-origin: center;
      }

      .locked-node {
        animation: gentle-pulse 4s ease-in-out infinite;
        transform-origin: center;
      }
    `);
});
