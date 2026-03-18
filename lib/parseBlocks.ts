import type { MessageBlock } from './types'

export function parseBlocks(message: string): MessageBlock[] {
  const blocks: MessageBlock[] = []
  let lastIndex = 0

  // Combined pattern: TRACKING, WHATSAPP, CATALOG, or one-or-more PRODUCT tags
  const combinedPattern = /\[(TRACKING|WHATSAPP|CATALOG)\](.*?)\[\/\1\]|\[PRODUCT\](.*?)\[\/PRODUCT\]/gs

  const matches = [...message.matchAll(combinedPattern)]

  for (const match of matches) {
    const matchIndex = match.index ?? 0

    // Text before this block
    if (matchIndex > lastIndex) {
      const textBefore = message.slice(lastIndex, matchIndex).trim()
      if (textBefore) {
        blocks.push({ type: 'text', data: textBefore })
      }
    }

    if (match[1]) {
      // TRACKING / WHATSAPP / CATALOG
      const blockType = match[1].toLowerCase() as 'tracking' | 'whatsapp' | 'catalog'
      try {
        const data = JSON.parse(match[2])
        blocks.push({ type: blockType, data })
      } catch {
        blocks.push({ type: 'text', data: match[0] })
      }
      lastIndex = matchIndex + match[0].length
    } else {
      // Single [PRODUCT] hit — collect ALL consecutive [PRODUCT] tags starting here
      // Find the full span of consecutive product tags
      const productPattern = /\[PRODUCT\](.*?)\[\/PRODUCT\]/gs
      productPattern.lastIndex = matchIndex

      const products: any[] = []
      let productMatch: RegExpExecArray | null
      let endIndex = matchIndex

      while ((productMatch = productPattern.exec(message)) !== null) {
        // Stop if there's non-whitespace between the last end and this start
        const gap = message.slice(endIndex, productMatch.index).trim()
        if (endIndex > matchIndex && gap !== '') break

        try {
          const parsed = JSON.parse(productMatch[1])
          // The bot sometimes sends an array inside a single [PRODUCT] tag
          if (Array.isArray(parsed)) {
            products.push(...parsed)
          } else {
            products.push(parsed)
          }
        } catch {
          // skip malformed
        }
        endIndex = productMatch.index + productMatch[0].length
      }

      if (products.length > 0) {
        blocks.push({ type: 'product', data: products })
      }

      lastIndex = endIndex
    }
  }

  // Remaining text
  if (lastIndex < message.length) {
    const remainingText = message.slice(lastIndex).trim()
    if (remainingText) {
      blocks.push({ type: 'text', data: remainingText })
    }
  }

  if (blocks.length === 0 && message.trim()) {
    blocks.push({ type: 'text', data: message.trim() })
  }

  return blocks
}
