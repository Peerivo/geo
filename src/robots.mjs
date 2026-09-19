function normalizeAgent(value) {
  return value.trim().toLowerCase();
}

export function parseRobots(text) {
  const groups = [];
  let current = null;
  let seenRule = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (key === "user-agent") {
      if (!current || seenRule) {
        current = { agents: [], rules: [] };
        groups.push(current);
        seenRule = false;
      }
      current.agents.push(normalizeAgent(value));
      continue;
    }

    if (!current) continue;
    if (key === "allow" || key === "disallow") {
      current.rules.push({ type: key, path: value });
      seenRule = true;
    }
  }

  return groups;
}

function matchingGroups(groups, userAgent) {
  const ua = normalizeAgent(userAgent);
  let bestSpecificity = -1;
  const matches = [];

  for (const group of groups) {
    const matched = group.agents
      .map((agent) => agent === "*" ? { agent, specificity: 0 } : (ua.includes(agent) ? { agent, specificity: agent.length } : null))
      .filter(Boolean)
      .sort((a, b) => b.specificity - a.specificity)[0];

    if (!matched) continue;
    if (matched.specificity > bestSpecificity) {
      bestSpecificity = matched.specificity;
      matches.length = 0;
      matches.push(group);
    } else if (matched.specificity === bestSpecificity) {
      matches.push(group);
    }
  }

  return matches;
}

export function isPathAllowed(text, userAgent, pathname) {
  const groups = matchingGroups(parseRobots(text), userAgent);
  if (groups.length === 0) return true;

  const candidateRules = groups.flatMap((group) => group.rules)
    .filter((rule) => rule.path !== "" && pathname.startsWith(rule.path));

  if (candidateRules.length === 0) return true;

  candidateRules.sort((a, b) => {
    if (b.path.length !== a.path.length) return b.path.length - a.path.length;
    if (a.type === b.type) return 0;
    return a.type === "allow" ? -1 : 1;
  });

  return candidateRules[0].type === "allow";
}
