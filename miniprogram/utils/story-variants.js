// utils/story-variants.js —— 剧情节点解析与「玩家选项 → 发言/动作」转换
//
// 现状（对应 docs/杜甫全程玩家角色-修改实施方案.md 步骤五）：
//   · 22 地点最终版剧本已不含 roleVariants / trustVariants / trustVariant / tasks / effects；
//   · 杜甫运行时不再把 roleId / trustScore 作为剧情节点解析条件（chat.js 调用 resolveNode 不再传身份/信任上下文）；
//   · resolveNode 保留通用变体解析能力，作为安全兼容接口（未来若其它线路复用变体机制仍可用）。
//
// 历史主线仍由节点的 next 决定；本模块只负责：
//   1) resolveNode —— 无变体时原样透传（不修改源节点）；
//   2) playerChoiceNode —— 把选中的 option 转成玩家发言节点或动作节点。

function asPatch(variant) {
  if (typeof variant === 'string') return { text: variant };
  if (!variant || typeof variant !== 'object' || Array.isArray(variant)) return null;
  return variant;
}

function matchesTrustVariant(variant, context) {
  if (!variant || typeof variant !== 'object') return false;
  const score = Number(context.trustScore) || 0;
  const min = variant.minTrust === undefined ? 0 : Number(variant.minTrust);
  const max = variant.maxTrust === undefined ? Infinity : Number(variant.maxTrust);
  if (score < min || score > max) return false;
  if (variant.roleIds && variant.roleIds.length) {
    return variant.roleIds.indexOf(context.roleId) >= 0;
  }
  return true;
}

function cleanConditionFields(patch) {
  const next = Object.assign({}, patch);
  delete next.minTrust;
  delete next.maxTrust;
  delete next.roleIds;
  return next;
}

function resolveEntry(entry, context) {
  if (!entry || typeof entry !== 'object') return entry;
  let resolved = Object.assign({}, entry);
  const roleId = context.roleId || '';

  const rolePatch = asPatch(entry.roleVariants && entry.roleVariants[roleId]);
  if (rolePatch) resolved = Object.assign(resolved, cleanConditionFields(rolePatch));

  const trustVariants = [];
  if (entry.trustVariant) trustVariants.push(entry.trustVariant);
  if (Array.isArray(entry.trustVariants)) trustVariants.push.apply(trustVariants, entry.trustVariants);

  // 先套通用变体，再套指定身份的变体；同一身份同一阈值下，专属文本优先。
  trustVariants
    .filter(v => matchesTrustVariant(v, context))
    .sort((a, b) => {
      const trustDiff = (Number(a.minTrust) || 0) - (Number(b.minTrust) || 0);
      if (trustDiff) return trustDiff;
      return (a.roleIds && a.roleIds.length ? 1 : 0) - (b.roleIds && b.roleIds.length ? 1 : 0);
    })
    .forEach((variant) => {
      resolved = Object.assign(resolved, cleanConditionFields(variant));
    });

  return resolved;
}

function resolveNode(node, context) {
  const resolved = resolveEntry(node, context || {});
  if (!resolved || !Array.isArray(resolved.options)) return resolved;
  return Object.assign({}, resolved, {
    options: resolved.options.map(option => resolveEntry(option, context || {}))
  });
}

/**
 * 把选中的 option 转成玩家「发言」节点或「动作」节点。
 *
 * 数据语义（步骤五 B.3，不再用脆弱的括号文本猜测）：
 *   · spokenText  —— 显式口语台词（优先于按钮文案 text），生成 player talk 节点；
 *   · actionOnly  —— 标记为纯动作（如「（沉默）」「（望着山下）」），且未给 spokenText 时，
 *                    生成 action 节点（由页面以旁白/动作行居中呈现，玩家立绘不登场说话）；
 *   · 两者都没有   —— 回退到按钮文案 text，生成 player talk 节点（向后兼容旧剧本）。
 *
 * @returns {object|null} { type:'talk', speaker:'player', text, next } 或
 *                        { type:'action', text, next }；非法/空文本返回 null
 */
function playerChoiceNode(option) {
  if (!option || typeof option !== 'object') return null;
  const next = option.result || option.next || '__end__';
  const spoken = String(option.spokenText || '').trim();
  const fallbackText = String(option.text || '').trim();

  // 纯动作且没有显式台词：只做动作，不口述
  if (option.actionOnly === true && !spoken) {
    if (!fallbackText) return null;
    return { type: 'action', text: fallbackText, next };
  }

  const text = spoken || fallbackText;
  if (!text) return null;
  return { type: 'talk', speaker: 'player', npc: true, text, next };
}

module.exports = { resolveNode, playerChoiceNode };
