/**
 * "Submit Good Work" form and its submit hook.
 */
import React from "react";
import { render, screen, waitFor, renderHook, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { AchievementForm } from "@/components/achievement-form";
import { useSubmitAchievement } from "@/hooks/use-submit-achievement";
import { server, API } from "../utils/server";

const titles = [
  { _id: "t1", title: "Research paper published", points: 10, type: "positive" },
  { _id: "t2", title: "Workshop conducted", points: 5, type: "positive" },
] as any[];

async function chooseCategory(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("combobox", { name: /category/i }));
  await user.click(await screen.findByRole("option", { name }));
}

describe("AchievementForm", () => {
  test("uses the configured current academic year and excludes closed years from submissions", async () => {
    server.use(
      http.get(`${API}/settings`, () =>
        HttpResponse.json({
          success: true,
          data: {
            currentAcademicYear: "2030-31",
            academicYears: [
              { id: "2030-31", status: "open" },
              { id: "2029-30", status: "closed" },
            ],
          },
        }),
      ),
    );
    const user = userEvent.setup();
    render(<AchievementForm creditTitles={titles} onSubmit={jest.fn()} isLoading={false} />);
    const select = screen.getByRole("combobox", { name: /academic year/i });
    await waitFor(() => expect(select).toHaveTextContent("2030-31"));
    await user.click(select);
    expect(await screen.findByRole("option", { name: "2030-31" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "2029-30" })).not.toBeInTheDocument();
  });
  test("empty submit shows required-field messages and does not submit", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<AchievementForm creditTitles={titles} onSubmit={onSubmit} isLoading={false} />);
    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(await screen.findByText("Achievement title is required.")).toBeInTheDocument();
    expect(screen.getByText("Category is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("whitespace-only title is rejected", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<AchievementForm creditTitles={titles} onSubmit={onSubmit} isLoading={false} />);
    await user.type(screen.getByLabelText(/achievement title/i), "    ");
    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(await screen.findByText("Achievement title is required.")).toBeInTheDocument();
  });

  test("points come from the chosen category and are read-only", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<AchievementForm creditTitles={titles} onSubmit={onSubmit} isLoading={false} />);
    await chooseCategory(user, "Workshop conducted");
    const points = screen.getByLabelText(/^points$/i);
    expect(points).toHaveValue("5");
    expect(points).toHaveAttribute("readonly");
    await user.type(screen.getByLabelText(/achievement title/i), "Ran a Python workshop");
    await user.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Ran a Python workshop",
          creditTitleId: "t2",
          points: 5,
        }),
      ),
    );
  });

  test("submit button disabled while loading", () => {
    render(<AchievementForm creditTitles={titles} onSubmit={jest.fn()} isLoading />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  test("loading with no categories yet shows a skeleton instead of the form", () => {
    const { container } = render(<AchievementForm creditTitles={[]} onSubmit={jest.fn()} isLoading />);
    expect(container.querySelector("form")).toBeNull();
  });
});

describe("useSubmitAchievement", () => {
  const url = `${API.replace("/api/v1", "")}/api/v1/credits/credits/positive`;
  const data = {
    title: "X",
    points: 10,
    academicYear: "2025-2026",
    proof: null,
    creditTitleId: "t1",
    notes: "",
  } as any;

  test('no token: throws "please log in again" without calling the API', async () => {
    const { result } = renderHook(() => useSubmitAchievement());
    await expect(result.current.submitAchievement(data)).rejects.toThrow(/log in again/i);
  });

  test("sends multipart form data with the token", async () => {
    localStorage.setItem("token", "tok");
    let seen: { auth: string | null; fields: Record<string, string> } | null = null;
    server.use(
      http.post(url, async ({ request }) => {
        const form = await request.formData();
        seen = {
          auth: request.headers.get("authorization"),
          fields: Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])),
        };
        return HttpResponse.json({ success: true, data: { _id: "c1" } }, { status: 201 });
      }),
    );
    const { result } = renderHook(() => useSubmitAchievement());
    await act(async () => {
      await result.current.submitAchievement(data);
    });
    expect(seen).toEqual({
      auth: "Bearer tok",
      fields: { title: "X", points: "10", academicYear: "2025-2026", categories: "t1" },
    });
  });

  test("server validation message is passed to the user", async () => {
    localStorage.setItem("token", "tok");
    server.use(
      http.post(url, () =>
        HttpResponse.json({ success: false, message: "Points must be a positive number" }, { status: 400 }),
      ),
    );
    const { result } = renderHook(() => useSubmitAchievement());
    await expect(result.current.submitAchievement(data)).rejects.toThrow("Points must be a positive number");
  });

  test("[INFO] points are only enforced by the UI: the request carries a points value the server trusts", async () => {
    // The backend accepts any positive number (confirmed in backend tests: 1,000,000,000 accepted).
    localStorage.setItem("token", "tok");
    let points = "";
    server.use(
      http.post(url, async ({ request }) => {
        points = String((await request.formData()).get("points"));
        return HttpResponse.json({ success: true });
      }),
    );
    const { result } = renderHook(() => useSubmitAchievement());
    await act(async () => {
      await result.current.submitAchievement({ ...data, points: 999999 });
    });
    expect(points).toBe("999999");
  });
});
