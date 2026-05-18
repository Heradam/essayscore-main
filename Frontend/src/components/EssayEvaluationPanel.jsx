import React, { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Star } from 'lucide-react';
import { apiRequest } from '../api/client.js';

const STAR_COUNT = 5;
const STAR_STEPS = 2;

const clampRating = (value) => {
    const normalized = Math.round(value * STAR_STEPS) / STAR_STEPS;
    return Math.max(0.5, Math.min(STAR_COUNT, normalized));
};

const resolvePointerRating = (event, index) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = 'touches' in event && event.touches[0]
        ? event.touches[0].clientX
        : event.clientX;
    const relativeX = Math.max(0, Math.min(rect.width, pointerX - rect.left));
    const portion = relativeX <= rect.width / 2 ? 0.5 : 1;
    return clampRating(index + portion);
};

const EssayEvaluationPanel = ({ essayId, initialRating, initialReview, initialReviewedAt, onSaved, setNotification }) => {
    const [rating, setRating] = useState(initialRating || 0);
    const [review, setReview] = useState(initialReview || '');
    const [reviewedAt, setReviewedAt] = useState(initialReviewedAt || null);
    const [hoverRating, setHoverRating] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setRating(initialRating || 0);
        setReview(initialReview || '');
        setReviewedAt(initialReviewedAt || null);
    }, [initialRating, initialReview, initialReviewedAt, essayId]);

    useEffect(() => {
        if (!isDragging) {
            return undefined;
        }

        const stopDragging = () => setIsDragging(false);
        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchend', stopDragging);

        return () => {
            window.removeEventListener('mouseup', stopDragging);
            window.removeEventListener('touchend', stopDragging);
        };
    }, [isDragging]);

    const visibleRating = hoverRating || rating;
    const hasSavedFeedback = reviewedAt || initialReviewedAt;

    const handleSave = async () => {
        if (rating < 0.5 || rating > 5) {
            setNotification?.({ type: 'error', message: '请先选择 0.5 到 5 星的评分效果评价。' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await apiRequest(`/api/v1/essay/${essayId}/evaluation`, {
                method: 'PATCH',
                data: {
                    rating,
                    review,
                },
            });

            const evaluation = result.evaluation || {};
            setRating(evaluation.userRating || rating);
            setReview(evaluation.userReview || '');
            setReviewedAt(evaluation.userReviewedAt || null);
            onSaved?.(evaluation);
            setNotification?.({ type: 'success', message: result.message || '评分效果反馈已保存。' });
        } catch (error) {
            setNotification?.({ type: 'error', message: error.message || '评分效果反馈保存失败。' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="surface-float p-6 md:p-8 rounded-3xl">
            <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                    <h2 className="text-2xl font-semibold text-emerald-700 flex items-center">
                        <MessageSquare className="w-6 h-6 mr-2" />
                        评分效果反馈
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">
                        对本次评分结果进行星级评价，并补充文字意见。
                    </p>
                </div>
                {hasSavedFeedback && (
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                        已反馈 {new Date(reviewedAt || initialReviewedAt).toLocaleString('zh-CN')}
                    </span>
                )}
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5">
                <p className="text-sm font-semibold text-slate-700 mb-3">拖动或点击星级</p>
                <div
                    className="flex items-center gap-2 select-none"
                    onMouseLeave={() => !isDragging && setHoverRating(0)}
                >
                    {Array.from({ length: STAR_COUNT }, (_, index) => {
                        const fillPercentage = Math.max(0, Math.min(1, visibleRating - index)) * 100;

                        return (
                            <button
                                key={index}
                                type="button"
                                aria-label={`第 ${index + 1} 颗星`}
                                className="p-1"
                                onMouseDown={(event) => {
                                    const nextRating = resolvePointerRating(event, index);
                                    setIsDragging(true);
                                    setRating(nextRating);
                                    setHoverRating(nextRating);
                                }}
                                onMouseMove={(event) => {
                                    const nextRating = resolvePointerRating(event, index);
                                    if (isDragging) {
                                        setRating(nextRating);
                                    }
                                    setHoverRating(nextRating);
                                }}
                                onTouchStart={(event) => {
                                    const nextRating = resolvePointerRating(event, index);
                                    setIsDragging(true);
                                    setRating(nextRating);
                                    setHoverRating(nextRating);
                                }}
                                onTouchMove={(event) => {
                                    const nextRating = resolvePointerRating(event, index);
                                    setRating(nextRating);
                                    setHoverRating(nextRating);
                                }}
                                onFocus={() => setHoverRating(index + 1)}
                                onBlur={() => setHoverRating(0)}
                                onClick={(event) => {
                                    const nextRating = resolvePointerRating(event, index);
                                    setRating(nextRating);
                                    setHoverRating(nextRating);
                                }}
                            >
                                <span className="relative block h-8 w-8">
                                    <Star className="absolute inset-0 h-8 w-8 text-slate-300" />
                                    <span
                                        className="absolute inset-y-0 left-0 overflow-hidden"
                                        style={{ width: `${fillPercentage}%` }}
                                    >
                                        <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                    <span className="ml-3 text-sm font-medium text-slate-600">
                        {rating > 0 ? `${rating} / ${STAR_COUNT}` : '未评分'}
                    </span>
                </div>
            </div>

            <div className="mt-5">
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                    对这次评分的文字评价
                </label>
                <textarea
                    value={review}
                    onChange={(event) => setReview(event.target.value.slice(0, 500))}
                    rows="4"
                    placeholder="请输入你对本次评分结果的看法，例如评分是否合理、反馈是否有帮助。"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition resize-none"
                />
                <div className="mt-2 text-right text-xs text-slate-400">
                    {review.length} / 500
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-400">
                    星级和文字意见可一并提交，后续可再次修改。
                </p>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            保存中...
                        </>
                    ) : hasSavedFeedback ? '更新反馈' : '提交反馈'}
                </button>
            </div>
        </div>
    );
};

export default EssayEvaluationPanel;
