// P3BA2: Real API - 정치인 상세 (Supabase + AI Evaluations)
// 정치인 상세 정보 및 AI 평가 데이터 조회
// P3F4: Field mapping and community statistics

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { mapPoliticianFields } from "@/utils/fieldMapper";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "정치인 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Supabase 서버 클라이언트 생성 (RLS 적용)
    const supabase = await createClient();

    // 정치인 상세 정보 조회
    const { data: politician, error: politicianError } = await supabase
      .from("politicians")
      .select("*")
      .eq("id", id)
      .single();

    if (politicianError) {
      console.error("Supabase query error:", politicianError);
      if (politicianError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "정치인을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "데이터베이스 조회 중 오류가 발생했습니다.",
          details: politicianError.message
        },
        { status: 500 }
      );
    }

    // AI 평가 정보 조회 (ai_evaluations 테이블 - legacy)
    const { data: aiEvaluations, error: evalError } = await supabase
      .from("ai_evaluations")
      .select("*")
      .eq("politician_id", id)
      .order("created_at", { ascending: false });

    if (evalError) {
      console.error("AI evaluations query error:", evalError);
    }

    // V40 AI 최종 점수 조회 (ai_final_scores_v40 테이블)
    // category_scores: {expertise, leadership, ...} 평균 점수
    // ai_category_scores: {Claude: {...}, ChatGPT: {...}, Gemini: {...}, Grok: {...}} AI별 카테고리 점수
    const { data: aiFinalScores, error: finalScoreError } = await supabase
      .from("ai_final_scores_v40")
      .select("politician_id, final_score, ai_final_scores, grade, calculated_at, category_scores, ai_category_scores")
      .eq("politician_id", id)
      .single();

    if (finalScoreError && finalScoreError.code !== "PGRST116") {
      console.error("AI final scores v40 query error:", finalScoreError);
    }

    // P3F4: Calculate community statistics
    // Count posts by this politician
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("upvotes, downvotes")
      .eq("user_id", id)
      .eq("author_type", "politician");

    const postCount = posts?.length || 0;
    const upvoteCount = posts?.reduce((sum, post) => sum + (post.upvotes || 0), 0) || 0;
    const downvoteCount = posts?.reduce((sum, post) => sum + (post.downvotes || 0), 0) || 0;

    // Count posts where this politician is tagged (회원 자유게시판에서만 - 정치인이 쓴 글 제외)
    const { count: taggedCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .contains("tagged_politicians", [politician.name])
      .neq("author_type", "politician"); // 정치인이 직접 쓴 글은 제외

    // AI 평가 데이터 그룹화 (모델별)
    const evaluationsByModel: Record<string, any> = {};
    aiEvaluations?.forEach((evaluation) => {
      const modelKey = evaluation.ai_model.toLowerCase();
      evaluationsByModel[modelKey] = {
        overall_score: evaluation.overall_score,
        created_at: evaluation.created_at,
        expiry_date: evaluation.expiry_date,
        report_url: evaluation.report_url,
        raw_data: evaluation.raw_data,
      };
    });

    // P3F4: Map fields using fieldMapper (snake_case → camelCase)
    const mappedData = mapPoliticianFields(politician, {
      postCount,
      upvoteCount,
      downvoteCount,
      taggedCount: taggedCount || 0,
    });

    // V24.0 등급 계산 함수
    const calculateV24Grade = (score: number): { grade: string; gradeEmoji: string; gradeName: string } => {
      if (score >= 920) return { grade: 'M', gradeEmoji: '🌺', gradeName: 'Mugunghwa' };
      if (score >= 840) return { grade: 'D', gradeEmoji: '💎', gradeName: 'Diamond' };
      if (score >= 760) return { grade: 'E', gradeEmoji: '💚', gradeName: 'Emerald' };
      if (score >= 680) return { grade: 'P', gradeEmoji: '🥇', gradeName: 'Platinum' };
      if (score >= 600) return { grade: 'G', gradeEmoji: '🥇', gradeName: 'Gold' };
      if (score >= 520) return { grade: 'S', gradeEmoji: '🥈', gradeName: 'Silver' };
      if (score >= 440) return { grade: 'B', gradeEmoji: '🥉', gradeName: 'Bronze' };
      if (score >= 360) return { grade: 'I', gradeEmoji: '⚫', gradeName: 'Iron' };
      if (score >= 280) return { grade: 'Tn', gradeEmoji: '⬜', gradeName: 'Tin' };
      return { grade: 'L', gradeEmoji: '⬛', gradeName: 'Lead' };
    };

    // V40 점수 및 등급 정보 추가
    let v24Score = null;
    let v24Grade = null;
    let v24GradeEmoji = null;
    let v24GradeName = null;
    let v24CategoryScores: any[] = [];
    let claudeScore = 0;
    let chatgptScore = 0;
    let geminiScore = 0;
    let grokScore = 0;

    if (aiFinalScores) {
      // V40 스키마: final_score, ai_final_scores JSONB {Claude, ChatGPT, Gemini, Grok}
      v24Score = aiFinalScores.final_score;

      const aiScores = aiFinalScores.ai_final_scores || {};
      claudeScore = aiScores['Claude'] || 0;
      chatgptScore = aiScores['ChatGPT'] || 0;
      geminiScore = aiScores['Gemini'] || 0;
      grokScore = aiScores['Grok'] || 0;

      // 점수 기반으로 등급 정보 계산
      const gradeInfo = calculateV24Grade(v24Score);
      v24Grade = gradeInfo.grade;
      v24GradeName = gradeInfo.gradeName;
      v24GradeEmoji = gradeInfo.gradeEmoji;
    }

    // V40 카테고리별 점수 추출 (ai_final_scores_v40의 JSONB 필드 사용)
    const V40_CATEGORY_ORDER = ['expertise', 'leadership', 'vision', 'integrity', 'ethics', 'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'];
    if (aiFinalScores?.category_scores) {
      const catScores = aiFinalScores.category_scores || {};
      const aiCatScores = aiFinalScores.ai_category_scores || {};
      v24CategoryScores = V40_CATEGORY_ORDER.map((cat) => ({
        categoryKey: cat,
        score: catScores[cat] || 0,
        aiScores: {
          Claude: (aiCatScores['Claude'] || {})[cat] || 0,
          ChatGPT: (aiCatScores['ChatGPT'] || {})[cat] || 0,
          Gemini: (aiCatScores['Gemini'] || {})[cat] || 0,
          Grok: (aiCatScores['Grok'] || {})[cat] || 0,
        }
      }));
    }

    // Add AI evaluations to mapped data
    const responseData = {
      ...mappedData,
      // V40 AI 평가 정보 (Primary)
      totalScore: v24Score,
      claudeScore: claudeScore,
      chatgptScore: chatgptScore,
      geminiScore: geminiScore,
      grokScore: grokScore,
      grade: v24Grade,
      gradeEmoji: v24GradeEmoji,
      gradeName: v24GradeName,
      categoryScores: v24CategoryScores,
      lastUpdated: aiFinalScores?.calculated_at || null,
      // Legacy AI 평가 정보 (ai_evaluations 테이블)
      ai_evaluations: evaluationsByModel,
      has_evaluations: Object.keys(evaluationsByModel).length > 0 || v24Score !== null,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/politicians/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Supabase 서버 클라이언트 생성
    const supabase = await createClient();

    // 업데이트 스키마 검증
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      name_kana: z.string().optional(),
      name_english: z.string().optional(),
      birth_date: z.string().optional(),
      gender: z.enum(["M", "F", "O"]).optional(),
      political_party_id: z.number().optional(),
      position_id: z.number().optional(),
      constituency_id: z.number().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional(),
      twitter_handle: z.string().optional(),
      facebook_url: z.string().url().optional(),
      instagram_handle: z.string().optional(),
      profile_image_url: z.string().url().optional(),
      bio: z.string().optional(),
      is_active: z.boolean().optional(),
      verified_at: z.string().optional(),
    });

    const validated = updateSchema.parse(body);

    // 정치인 정보 업데이트 (RLS 정책 준수)
    const { data: updatedPolitician, error } = await supabase
      .from("politicians")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "정치인을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "정치인 정보 업데이트 중 오류가 발생했습니다.",
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedPolitician,
        message: "정치인 정보가 업데이트되었습니다."
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "유효하지 않은 입력 데이터입니다.",
        details: error.errors
      }, { status: 400 });
    }

    console.error("PATCH error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Supabase 서버 클라이언트 생성
    const supabase = await createClient();

    // 정치인 삭제 (소프트 삭제: is_active = false로 설정)
    const { data: deletedPolitician, error } = await supabase
      .from("politicians")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase soft delete error:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "정치인을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "정치인 삭제 중 오류가 발생했습니다.",
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "정치인이 비활성화되었습니다.",
        data: deletedPolitician
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
