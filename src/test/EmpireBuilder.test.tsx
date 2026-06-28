import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { EmpireBuilder } from "../components/games/EmpireBuilder";
import { gameService } from "../services/gameService";

// Mock gameService
vi.mock("../services/gameService", () => {
  return {
    gameService: {
      getEmpireItems: vi.fn().mockResolvedValue([
        {
          id: 1,
          name: "Investimento Ativo Teste",
          type: "active",
          base_cost: 10,
          base_income: 2,
          description: "Gera mais por clique"
        },
        {
          id: 2,
          name: "Investimento Passivo Teste",
          type: "passive",
          base_cost: 50,
          base_income: 5,
          description: "Gera por segundo"
        }
      ]),
      addUserXP: vi.fn(),
      resetEmpireBuilder: vi.fn().mockResolvedValue({ success: true })
    }
  };
});

describe("EmpireBuilder Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should render the initial balance and increment on work click", async () => {
    let renderResult;
    await act(async () => {
      renderResult = render(<EmpireBuilder onBack={() => {}} />);
    });

    const workButton = await screen.findByRole("button", { name: /Trabalhar/i });
    expect(workButton).toBeInTheDocument();

    const balanceText = screen.getByText(/ED\$/);
    expect(balanceText).toBeInTheDocument();
    expect(balanceText.textContent).toContain("ED$ 0");

    // Click work button
    await act(async () => {
      fireEvent.click(workButton);
    });

    expect(balanceText.textContent).toContain("ED$ 1");
  });
});
