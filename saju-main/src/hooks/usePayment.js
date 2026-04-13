// src/hooks/usePayment.js
// 카카오페이 결제 기능 준비 중 — 향후 이 훅에 결제 로직을 구현합니다.
//
// 예상 구조:
//   - paymentStatus: 'idle' | 'pending' | 'success' | 'failed'
//   - selectedProduct: null | { id, name, price, features }
//   - initiatePayment(product): 결제 시작 (카카오페이 SDK 연동)
//   - confirmPayment(pgToken): 결제 승인 처리
//   - cancelPayment(tid): 결제 취소
//   - purchasedProducts: Set<string> — 구매 완료 상품 ID 목록

import { useState } from "react";

export function usePayment() {
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchasedProducts] = useState(new Set());

  // TODO: 카카오페이 결제 초기화
  const initiatePayment = async (product) => {
    setSelectedProduct(product);
    setPaymentStatus('pending');
    // 카카오페이 연동 구현 예정
    console.warn('[별숨] 결제 기능은 준비 중이에요');
    setPaymentStatus('idle');
  };

  const isPurchased = (productId) => purchasedProducts.has(productId);

  return {
    paymentStatus,
    selectedProduct, setSelectedProduct,
    purchasedProducts,
    initiatePayment,
    isPurchased,
  };
}
