import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cosine Similarity for Vector Embeddings
 * Values closer to 1 indicate higher similarity
 */
function cosineSimilarity(vecA: number[], vecB: number[]) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  return isNaN(similarity) ? 0 : similarity
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { detected_encoding, organization_id } = body

    if (!detected_encoding || !organization_id) {
      return NextResponse.json({ error: 'Missing encoding or organization_id' }, { status: 400 })
    }

    const supabase = createClient()

    // Get all members with existing face signatures
    const { data: members, error } = await supabase
      .from('members')
      .select('id, name, email, membership_status, face_encoding')
      .eq('organization_id', organization_id)
      .not('face_encoding', 'is', null)

    if (error) throw error

    // Find best match signature
    let bestMatch = null
    let bestScore = 0.6 // DeepFace Facenet similarity threshold

    members.forEach((member) => {
      try {
        const storedEncoding = typeof member.face_encoding === 'string' 
          ? JSON.parse(member.face_encoding) 
          : member.face_encoding
          
        const similarity = cosineSimilarity(detected_encoding, storedEncoding)

        if (similarity > bestScore) {
          bestScore = similarity
          bestMatch = member
        }
      } catch (e) {
        console.error('Error parsing encoding for member:', member.id)
      }
    })

    if (bestMatch) {
      return NextResponse.json({
        success: true,
        matched: true,
        member: {
          id: bestMatch.id,
          name: bestMatch.name,
          email: bestMatch.email,
          membership_status: bestMatch.membership_status
        },
        confidence: bestScore
      })
    }

    return NextResponse.json({
      success: true,
      matched: false,
      message: 'No match found in current organization database',
      confidence: bestScore
    })
  } catch (error: any) {
    console.error('Match face error:', error)
    return NextResponse.json({ error: 'AI Identification failed' }, { status: 500 })
  }
}
