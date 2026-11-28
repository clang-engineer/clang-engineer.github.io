import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location("families", pathlib.Path(__file__).with_name("build-theme-families.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class FamilyTests(unittest.TestCase):
    def test_family_matching(self):
        items = [{"id":"rose-pine/neovim","stars":500}, {"id":"rose-pine/rose-pine","stars":1000},
                 {"id":"folke/tokyonight.nvim","stars":800}]
        result = module.build(items, ["base16-rose-pine-dawn","base24-tokyo-night-storm","base16-rose-pine-unrelated"])
        self.assertEqual(result["families"]["rosepine"]["stars"],1000)
        self.assertEqual(result["schemes"]["base24-tokyo-night-storm"],"tokyonight")
        self.assertEqual(result["coverage"]["unmatched"],["base16-rose-pine-unrelated"])

if __name__ == "__main__":
    unittest.main()
