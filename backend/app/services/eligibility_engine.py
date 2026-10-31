import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.db_models import DBScheme, DBSchemeRule
from app.models.schemas import CriterionCheck, EligibilityAssessmentResult

logger = logging.getLogger("civiconnect.eligibility")

ALLOWED_OPERATORS = {"eq", "neq", "gte", "gt", "lte", "lt", "in", "not_in", "is_true"}

FIELD_ALIASES = {
    "land_ownership": ["owns_cultivable_land", "land_holding", "cultivable_land"],
    "owns_cultivable_land": ["land_ownership", "land_holding", "cultivable_land"],
    "annual_household_income": ["income", "family_income", "household_income", "annual_income"],
    "income": ["annual_household_income", "family_income", "household_income", "annual_income"],
    "social_category": ["category", "caste"],
    "is_bpl": ["bpl_status", "bpl"],
    "citizenship": ["nationality"],
}


class EligibilityEngine:
    @staticmethod
    def _resolve_profile_value(profile: Dict[str, Any], field: str) -> Any:
        if field in profile and profile[field] is not None and profile[field] != "":
            return profile[field]
        aliases = FIELD_ALIASES.get(field, [])
        for alt in aliases:
            if alt in profile and profile[alt] is not None and profile[alt] != "":
                return profile[alt]
        return None

    @staticmethod
    def evaluate_criterion(rule: DBSchemeRule, profile: Dict[str, Any]) -> CriterionCheck:
        field = rule.field_name
        operator = rule.operator.lower()
        description = rule.description
        
        try:
            expected = json.loads(rule.expected_value_json)
        except Exception:
            expected = rule.expected_value_json

        actual = EligibilityEngine._resolve_profile_value(profile, field)

        # Check if field exists and is not None in user profile
        if actual is None:
            return CriterionCheck(
                field=field,
                status="unknown",
                description=description,
                expected_value=expected,
                actual_value=None,
                reason=f"Information for '{field}' was not provided in profile."
            )

        try:
            passed = False
            reason = ""

            if operator == "eq":
                if isinstance(actual, str) and isinstance(expected, str):
                    passed = actual.strip().lower() == expected.strip().lower()
                else:
                    passed = actual == expected
                reason = f"Actual '{actual}' {'matches' if passed else 'does not match'} required '{expected}'."

            elif operator == "neq":
                if isinstance(actual, str) and isinstance(expected, str):
                    passed = actual.strip().lower() != expected.strip().lower()
                else:
                    passed = actual != expected
                reason = f"Actual '{actual}' {'satisfies exclusion requirement' if passed else 'is in excluded category'}."

            elif operator in {"gte", "gt", "lte", "lt"}:
                num_actual = float(actual)
                num_expected = float(expected)
                if operator == "gte":
                    passed = num_actual >= num_expected
                    reason = f"Actual value ({num_actual}) is {'at least' if passed else 'below'} required minimum ({num_expected})."
                elif operator == "gt":
                    passed = num_actual > num_expected
                    reason = f"Actual value ({num_actual}) is {'greater than' if passed else 'not greater than'} required threshold ({num_expected})."
                elif operator == "lte":
                    passed = num_actual <= num_expected
                    reason = f"Actual value ({num_actual}) is {'within' if passed else 'exceeds'} allowable ceiling of ({num_expected})."
                elif operator == "lt":
                    passed = num_actual < num_expected
                    reason = f"Actual value ({num_actual}) is {'strictly below' if passed else 'meets or exceeds'} maximum limit ({num_expected})."

            elif operator == "in":
                if isinstance(expected, list):
                    if isinstance(actual, str):
                        exp_lower = [str(x).strip().lower() for x in expected]
                        passed = actual.strip().lower() in exp_lower
                    else:
                        passed = actual in expected
                else:
                    passed = False
                reason = f"Actual '{actual}' is {'among valid categories' if passed else 'not in eligible categories'} ({expected})."

            elif operator == "not_in":
                if isinstance(expected, list):
                    if isinstance(actual, str):
                        exp_lower = [str(x).strip().lower() for x in expected]
                        passed = actual.strip().lower() not in exp_lower
                    else:
                        passed = actual not in expected
                else:
                    passed = True
                reason = f"Actual '{actual}' is {'not in excluded group' if passed else 'found in excluded group'} ({expected})."

            elif operator == "is_true":
                passed = bool(actual) is True
                reason = f"Condition confirmed true: {passed}."

            else:
                return CriterionCheck(
                    field=field,
                    status="unknown",
                    description=description,
                    expected_value=expected,
                    actual_value=actual,
                    reason=f"Operator '{operator}' requires human/official verification."
                )

            return CriterionCheck(
                field=field,
                status="pass" if passed else "fail",
                description=description,
                expected_value=expected,
                actual_value=actual,
                reason=reason
            )

        except (ValueError, TypeError) as e:
            return CriterionCheck(
                field=field,
                status="unknown",
                description=description,
                expected_value=expected,
                actual_value=actual,
                reason=f"Type comparison error for '{field}': {str(e)}."
            )

    @classmethod
    def assess_scheme(cls, scheme: DBScheme, profile: Dict[str, Any]) -> EligibilityAssessmentResult:
        rules = scheme.rules
        checks: List[CriterionCheck] = []
        passed_count = 0
        failed_count = 0
        unknown_count = 0
        missing_fields: List[str] = []

        # Location check: state applicability
        try:
            applicable_states = json.loads(scheme.applicable_states)
        except Exception:
            applicable_states = ["ALL"]

        user_state = profile.get("state")
        if "ALL" not in applicable_states and user_state:
            state_match = any(user_state.strip().lower() == s.strip().lower() for s in applicable_states)
            if not state_match:
                checks.append(CriterionCheck(
                    field="state",
                    status="fail",
                    description=f"Scheme applies only to residents of: {', '.join(applicable_states)}",
                    expected_value=applicable_states,
                    actual_value=user_state,
                    reason=f"Your profile state '{user_state}' is not within the jurisdiction of this scheme."
                ))
                failed_count += 1
            else:
                checks.append(CriterionCheck(
                    field="state",
                    status="pass",
                    description=f"Jurisdiction matches: {user_state}",
                    expected_value=applicable_states,
                    actual_value=user_state,
                    reason=f"State requirement matched ({user_state})."
                ))
                passed_count += 1
        elif "ALL" not in applicable_states and not user_state:
            checks.append(CriterionCheck(
                field="state",
                status="unknown",
                description=f"Scheme requires state domicile in: {', '.join(applicable_states)}",
                expected_value=applicable_states,
                actual_value=None,
                reason="State of residence not provided in profile."
            ))
            unknown_count += 1
            missing_fields.append("state")

        for rule in rules:
            c_check = cls.evaluate_criterion(rule, profile)
            checks.append(c_check)
            if c_check.status == "pass":
                passed_count += 1
            elif c_check.status == "fail":
                failed_count += 1
            else:
                unknown_count += 1
                if c_check.field not in missing_fields:
                    missing_fields.append(c_check.field)

        total_rules = len(checks)

        if failed_count > 0:
            verdict = "not_eligible_based_on_known_rules"
            summary = (
                f"You do not meet {failed_count} verified eligibility requirement(s) for {scheme.name}. "
                f"Review the criteria below for specific exclusion factors."
            )
        elif total_rules > 0 and unknown_count == total_rules:
            verdict = "insufficient_information"
            summary = (
                f"Insufficient profile information to assess eligibility for {scheme.name}. "
                f"Please update your profile details (e.g. {', '.join(missing_fields[:3])})."
            )
        elif unknown_count > 0:
            verdict = "possibly_eligible"
            summary = (
                f"You meet {passed_count} verified condition(s) for {scheme.name}, but {unknown_count} "
                f"condition(s) still require missing profile confirmation."
            )
        else:
            verdict = "likely_eligible"
            summary = (
                f"Based on your profile, you meet all {passed_count} verified rules for {scheme.name}. "
                f"Final approval requires formal document submission to the responsible authority."
            )

        sources_data = [
            {
                "title": src.source_title,
                "url": src.source_url,
                "publisher": src.publisher,
                "last_verified": src.last_verified
            }
            for src in scheme.sources
        ]

        return EligibilityAssessmentResult(
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            verdict=verdict,
            summary=summary,
            total_rules=total_rules,
            passed_rules=passed_count,
            failed_rules=failed_count,
            unknown_rules=unknown_count,
            checks=checks,
            missing_fields=missing_fields,
            official_portal_url=scheme.official_portal_url,
            official_verification_required=True,
            sources=sources_data
        )

    @classmethod
    def evaluate_all_schemes(
        cls,
        db: Session,
        profile: Dict[str, Any],
        category: Optional[str] = None,
        limit: int = 50
    ) -> List[EligibilityAssessmentResult]:
        query = db.query(DBScheme).filter(DBScheme.status == "active")
        if category:
            query = query.filter(DBScheme.category == category)
        
        schemes = query.all()
        results: List[EligibilityAssessmentResult] = []

        # Sort order: likely_eligible first, then possibly_eligible, then insufficient_information, then not_eligible
        verdict_weights = {
            "likely_eligible": 4,
            "possibly_eligible": 3,
            "insufficient_information": 2,
            "not_eligible_based_on_known_rules": 1
        }

        for scheme in schemes:
            res = cls.assess_scheme(scheme, profile)
            results.append(res)

        results.sort(key=lambda r: verdict_weights.get(r.verdict, 0), reverse=True)
        return results[:limit]
