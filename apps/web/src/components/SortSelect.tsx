"use client";

type Labels = { sort: string; newest: string; "price-asc": string; "price-desc": string; name: string };

/** Sort dropdown that submits its form on change (the Apply button still works without JS). */
export function SortSelect({ defaultValue, labels }: { defaultValue: string; labels: Labels }) {
  return (
    <div>
      <label htmlFor="f-sort" className="label">{labels.sort}</label>
      <select
        id="f-sort"
        name="sort"
        defaultValue={defaultValue}
        className="input"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {(["newest", "price-asc", "price-desc", "name"] as const).map((v) => (
          <option key={v} value={v}>{labels[v]}</option>
        ))}
      </select>
    </div>
  );
}
